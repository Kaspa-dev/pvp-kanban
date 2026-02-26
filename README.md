# PVP

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) v18+ (for the frontend)

## Running the Frontend

The frontend is a React + TypeScript app built with Vite (located in the `FE/` directory).

1. Navigate to the frontend directory:
   ```bash
   cd FE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build:
   ```bash
   npm run preview
   ```

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