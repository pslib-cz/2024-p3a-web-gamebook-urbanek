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

# Build .NET server
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["stinsily.Server/stinsily.Server.csproj", "./"]
# Remove client project reference for Docker build
RUN sed -i '/<ProjectReference.*stinsily.client.esproj/,/<\/ProjectReference>/d' stinsily.Server.csproj
RUN dotnet restore
COPY ["stinsily.Server/", "./"]
RUN mkdir -p wwwroot
COPY --from=client-build /src/client/dist wwwroot/
RUN dotnet build "stinsily.Server.csproj" -c Release -o /app/build

# Publish .NET server
FROM build AS publish
RUN dotnet publish "stinsily.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Copy the pre-initialized database
COPY ["stinsily.Server/data/gamebook.db", "./data/"]
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/gamebook.db"
ENTRYPOINT ["dotnet", "stinsily.Server.dll"]