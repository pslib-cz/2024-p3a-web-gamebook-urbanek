# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Build React client
FROM node:20-alpine AS client-build
WORKDIR /src/client
ENV DOCKER_BUILD=true
COPY ["stinsily.client/package*.json", "./"]
RUN npm install
COPY ["stinsily.client/", "./"]
RUN npm run build

# Build .NET server and create database
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
ENV DOCKER_BUILD=true
ENV ASPNETCORE_ENVIRONMENT=Production
COPY ["stinsily.Server/stinsily.Server.csproj", "./"]
# Remove client project reference for Docker build
RUN sed -i '/<ProjectReference.*stinsily.client.esproj/,/<\/ProjectReference>/d' stinsily.Server.csproj
RUN dotnet restore
COPY ["stinsily.Server/", "./"]
RUN mkdir -p wwwroot data
COPY --from=client-build /src/client/dist wwwroot/

# Create initial database
RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"
RUN dotnet build "stinsily.Server.csproj" -c Release -o /app/build

# Publish .NET server
FROM build AS publish
RUN dotnet publish "stinsily.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=publish /app/publish .

# Ensure data directory exists with proper permissions
RUN mkdir -p /app/data
RUN chmod -R 777 /app/data
RUN chmod -R 777 /app

# Add diagnostic commands to run at startup
RUN echo '#!/bin/bash\n\
echo "Current directory: $(pwd)"\n\
echo "Directory listing:"\n\
ls -la\n\
echo "Data directory listing:"\n\
ls -la data\n\
echo "Current user: $(id)"\n\
echo "Starting application..."\n\
dotnet stinsily.Server.dll\n\
' > /app/start.sh && chmod +x /app/start.sh

USER $APP_UID
ENTRYPOINT ["/app/start.sh"]