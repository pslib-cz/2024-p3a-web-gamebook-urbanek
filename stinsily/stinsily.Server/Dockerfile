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
# Ensure data directory exists
RUN mkdir -p /app/data
RUN chown -R $APP_UID:$APP_UID /app
USER $APP_UID
ENTRYPOINT ["dotnet", "stinsily.Server.dll"]