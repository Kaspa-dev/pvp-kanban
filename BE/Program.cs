using BE.Data;
using Microsoft.EntityFrameworkCore;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure MySQL with EF Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!
    .Replace("${MYSQL_DATABASE}", Environment.GetEnvironmentVariable("MYSQL_DATABASE"))
    .Replace("${MYSQL_USER}", Environment.GetEnvironmentVariable("MYSQL_USER"))
    .Replace("${MYSQL_PASSWORD}", Environment.GetEnvironmentVariable("MYSQL_PASSWORD"));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySQL(connectionString));

var app = builder.Build();

// Apply migrations and seed data on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    DbSeeder.Seed(db);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
