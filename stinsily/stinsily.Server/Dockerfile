# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Build stage for client
FROM node:20-alpine AS client-build
WORKDIR /src
COPY ["stinsily.client/package*.json", "stinsily.client/"]
WORKDIR /src/stinsily.client
ENV NODE_ENV=production
# Install dependencies and TypeScript globally
RUN npm install -g typescript
RUN npm install
COPY ["stinsily.client/", "./"]
# Install types for Node.js
RUN npm install --save-dev @types/node
RUN npm run build

# Build stage for server
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["stinsily.Server/stinsily.Server.csproj", "stinsily.Server/"]
COPY ["stinsily.client/stinsily.client.esproj", "stinsily.client/"]
RUN dotnet restore "./stinsily.Server/stinsily.Server.csproj"
COPY . .
COPY --from=client-build /src/stinsily.client/dist /src/stinsily.Server/wwwroot
WORKDIR "/src/stinsily.Server"
RUN dotnet build "./stinsily.Server.csproj" -c Release -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
RUN dotnet publish "./stinsily.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "stinsily.Server.dll"]