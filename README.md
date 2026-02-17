# PVP

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker](https://www.docker.com/get-started)

## Database Setup

1. Navigate to the backend directory:
   ```bash
   cd BE
   ```

2. Create a `.env` file (copy the contents shared via Discord) with MySQL credentials:


3. Start the MySQL container:
   ```bash
   docker-compose up -d
   ```

4. Verify the container is running:
   ```bash
   docker ps
   ```

5. To stop the database:
   ```bash
   docker-compose down
   ```

> **Note:** Data is persisted in a Docker volume (`mysql_data`). To fully reset the database, run `docker-compose down -v`.

## Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd BE
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Apply EF Core migrations to create/update the database schema:
   ```bash
   dotnet ef database update
   ```

4. Run the application:
   ```bash
   dotnet run
   ```

5. Open Swagger UI to test the API:
   ```
   http://localhost:<port>/swagger
   ```

> **Note:** On first startup the app will automatically seed example data into the `BoardItems` table if it's empty.

## .NET CLI Reference

| Command | Description |
|---|---|
| `dotnet restore` | Restores the dependencies and tools of a project |
| `dotnet build` | Builds the project and all of its dependencies |
| `dotnet run` | Builds and runs the project |
| `dotnet ef migrations add <Name>` | Creates a new EF Core migration |
| `dotnet ef database update` | Applies pending migrations to the database |