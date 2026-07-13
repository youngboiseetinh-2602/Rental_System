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
DB_USERNAME=root
DB_PASSWORD=123456
JWT_SIGNER_KEY=replace_with_a_strong_random_secret_at_least_32_chars
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
