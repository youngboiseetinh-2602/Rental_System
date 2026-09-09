FROM maven:3.9.11-eclipse-temurin-21-alpine AS build

WORKDIR /build

COPY pom.xml ./
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /build/target/rental-resource-server-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080
# Giới hạn heap JVM để giảm nguy cơ vượt RAM của Render
ENTRYPOINT ["java", "-Xms64m", "-Xmx256m", "-jar", "app.jar"]
