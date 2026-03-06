# ─── Étape 1 : Build Maven ───────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# ─── Étape 2 : Image finale ──────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /app/templates /app/scripts /app/tmp/avis-output

# LibreOffice + Python pour la conversion DOCX → PDF
RUN apk add --no-cache libreoffice python3 && \
    ln -sf python3 /usr/bin/python

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
