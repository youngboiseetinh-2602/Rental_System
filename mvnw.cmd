@echo off
setlocal

set BASE_DIR=%~dp0
set WRAPPER_DIR=%BASE_DIR%.mvn\wrapper
set MAVEN_VERSION=3.9.11
set MAVEN_HOME=%WRAPPER_DIR%\apache-maven-%MAVEN_VERSION%
set MAVEN_ZIP=%WRAPPER_DIR%\apache-maven-%MAVEN_VERSION%-bin.zip
set MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "New-Item -ItemType Directory -Force '%WRAPPER_DIR%' | Out-Null; if (-not (Test-Path '%MAVEN_ZIP%')) { Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%' }; Expand-Archive -Path '%MAVEN_ZIP%' -DestinationPath '%WRAPPER_DIR%' -Force"
    if errorlevel 1 exit /b 1
)

call "%MAVEN_HOME%\bin\mvn.cmd" %*
endlocal
