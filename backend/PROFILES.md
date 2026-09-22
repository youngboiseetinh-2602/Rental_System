# Database profiles

The default profile is `local`. Both profiles use the same entities and repositories.

| Profile | Connection variables | Compatibility fallback |
| --- | --- | --- |
| `local` | `LOCAL_DB_URL`, `LOCAL_DB_USERNAME`, `LOCAL_DB_PASSWORD` | Existing `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |
| `production` | `TIDB_DB_URL`, `TIDB_DB_USERNAME`, `TIDB_DB_PASSWORD` | Existing `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |

Run locally from `backend`:

```powershell
.\mvnw.cmd spring-boot:run
```

For deployment, set `SPRING_PROFILES_ACTIVE=production` in the backend hosting environment,
and configure the three `TIDB_DB_*` variables using the JDBC connection details from TiDB.
If the host already has `DB_*` pointing to TiDB, those variables continue to work.
`TIDB_DB_URL` must be a full JDBC URL, not a username. Preserve the TLS settings supplied
by TiDB's Connect page.

To select production locally after configuring its connection in the ignored root `.env`:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=production"
```

The root `.env` is imported for local runs and is excluded from Git. It is not included
in the backend Docker image: configure deployment credentials on the hosting platform.
Do not commit real passwords into profile files.

Profiles choose a connection; they do not synchronize databases.

## Existing databases

Run the following separately on local MySQL and deployed TiDB if the notification
receiver column still rejects NULL:

```sql
ALTER TABLE notification MODIFY COLUMN receiverId BIGINT NULL;
```

Check existing indexes before removing the obsolete notification status index:

```sql
SHOW INDEX FROM notification;
```

Only if `idx_notification_receiver_status_sent_at` exists and
`idx_notification_receiver_id` is present to support receiver lookups and the foreign key:

```sql
ALTER TABLE notification DROP INDEX idx_notification_receiver_status_sent_at;
```

Changing entity annotations does not automatically remove existing database indexes.
The root `rental_room_system.sql` is the Docker initialization script for a fresh volume;
it does not update an existing database. Do not import that dump to migrate a database
containing data you want to keep.
