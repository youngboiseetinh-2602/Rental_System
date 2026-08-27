# Rental Room System

Rental Room System gồm Spring Boot backend và React frontend.

## Project structure

- `backend/` – Spring Boot API.
- `frontend/` – React + Vite application.
- `docker-compose.delivery.yml` – database and application services.
- `rental_room_system.sql` – initial database schema/data.

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
- ModelMapper
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
OAUTH2_CLIENT_INTERNAL_ID=replace_with_a_stable_uuid
OAUTH2_CLIENT_ID=rental-client
OAUTH2_REDIRECT_URI=http://localhost:3000/callback
CORS_ALLOWED_ORIGINS=https://rental-system-frontend-ihl5.onrender.com,http://localhost:3000
AUTHORIZATION_SERVER_ISSUER=http://localhost:8080
```

Run the backend:

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```bat
cd backend
.\mvnw.cmd spring-boot:run
```

Run the frontend in another terminal:

```bash
cd frontend
npm install
npm start
```

Health endpoint:

```text
GET http://localhost:8080/api/public/health
```

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```
