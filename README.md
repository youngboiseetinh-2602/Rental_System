# Rental Room System Backend

Spring Boot backend scaffold for Rental Room System, organized with the same layered structure as `intelij/demo`.

## Stack

- Java 21
- Spring Boot 3.5.x
- Spring Web
- Spring Validation
- Spring Data JPA
- MySQL Driver
- Spring Security
- Spring Authorization Server
- Spring OAuth2 Resource Server
- Lombok
- MapStruct
- ModelMapper
- Flyway
- Swagger/OpenAPI
- DevTools
- Spring Boot Test
- Spring Security Test

## Run locally

Create a local MySQL database:

```sql
CREATE DATABASE IF NOT EXISTS rental_room_system;
```

Create `.env` in the project root:

```properties
SERVER_PORT=8080
DB_URL=jdbc:mysql://localhost:3306/rental_room_system?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=your_database_password
JPA_DDL_AUTO=update
JPA_SHOW_SQL=true
JPA_FORMAT_SQL=true
FLYWAY_ENABLED=false
OAUTH2_CLIENT_INTERNAL_ID=replace_with_a_stable_uuid
OAUTH2_CLIENT_ID=rental-client
OAUTH2_REDIRECT_URI=http://localhost:3000/callback
CORS_ALLOWED_ORIGIN=http://localhost:3000
AUTHORIZATION_SERVER_ISSUER=http://localhost:8080
```

Run the app:

```bash
./mvnw spring-boot:run
```

On Windows:

```bat
.\mvnw.cmd spring-boot:run
```

Health endpoint:

```text
GET http://localhost:8080/api/public/health
```

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```
