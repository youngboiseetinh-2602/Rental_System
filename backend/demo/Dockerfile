FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY target/rental-resource-server-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]