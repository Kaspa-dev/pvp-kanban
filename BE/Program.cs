using BE.Data;
using BE.Hubs;
using Microsoft.EntityFrameworkCore;
using MySql.Data.MySqlClient;

var envPathCandidates = new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "BE", ".env"),
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")),
};

var envPath = envPathCandidates.FirstOrDefault(File.Exists);
if (!string.IsNullOrWhiteSpace(envPath))
{
    DotNetEnv.Env.Load(envPath);
}

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});
var allowedOrigins = builder.Configuration.GetSection("Realtime:AllowedOrigins").Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Distinct()
    .ToArray() ?? [];

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

if (allowedOrigins.Length > 0)
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("RealtimeCors", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
    });
}

// Configure MySQL with EF Core
var mysqlDatabase = Environment.GetEnvironmentVariable("MYSQL_DATABASE") ?? string.Empty;
var mysqlUser = Environment.GetEnvironmentVariable("MYSQL_USER") ?? string.Empty;
var mysqlPassword = Environment.GetEnvironmentVariable("MYSQL_PASSWORD") ?? string.Empty;

var rawConnectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(rawConnectionString))
{
    throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
}

var connectionString = rawConnectionString
    .Replace("${MYSQL_DATABASE}", mysqlDatabase)
    .Replace("${MYSQL_USER}", mysqlUser)
    .Replace("${MYSQL_PASSWORD}", mysqlPassword);

var connectionStringBuilder = new MySqlConnectionStringBuilder(connectionString);
var hasExplicitSslMode =
    rawConnectionString.Contains("SslMode", StringComparison.OrdinalIgnoreCase) ||
    rawConnectionString.Contains("Ssl Mode", StringComparison.OrdinalIgnoreCase) ||
    rawConnectionString.Contains("Ssl-Mode", StringComparison.OrdinalIgnoreCase);

if (!hasExplicitSslMode && IsLocalDatabaseHost(connectionStringBuilder.Server))
{
    connectionStringBuilder.SslMode = MySqlSslMode.Disabled;
}

connectionString = connectionStringBuilder.ConnectionString;

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

var app = builder.Build();

// Apply migrations and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");

    try
    {
        db.Database.Migrate();
        DbSeeder.Seed(db);
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Failed to initialize the database during application startup.");
        throw;
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

if (allowedOrigins.Length > 0)
{
    app.UseCors("RealtimeCors");
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapControllers();
app.MapHub<BoardHub>("/hubs/board");

app.Run();

static bool IsLocalDatabaseHost(string? host)
{
    if (string.IsNullOrWhiteSpace(host))
    {
        return false;
    }

    return host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
        host.Equals("::1", StringComparison.OrdinalIgnoreCase);
}
