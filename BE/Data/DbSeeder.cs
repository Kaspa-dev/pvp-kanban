using BE.Models;
using BE.Services;

namespace BE.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (context.Users.Any())
        {
            return;
        }

        string alicePassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_ALICE") ?? "ChangeMe@1";
        string bobPassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_BOB") ?? "ChangeMe@2";
        string charliePassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_CHARLIE") ?? "ChangeMe@3";

        var users = new[]
        {
            new User
            {
                Username = "alice_smith",
                Email = "alice@example.com",
                PasswordHash = PasswordHasher.HashPassword(alicePassword),
                FirstName = "Alice",
                LastName = "Smith",
                CreatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow,
            },
            new User
            {
                Username = "bob_jones",
                Email = "bob@example.com",
                PasswordHash = PasswordHasher.HashPassword(bobPassword),
                FirstName = "Bob",
                LastName = "Jones",
                CreatedAt = DateTime.UtcNow,
            },
            new User
            {
                Username = "charlie_brown",
                Email = "charlie@example.com",
                PasswordHash = PasswordHasher.HashPassword(charliePassword),
                FirstName = "Charlie",
                LastName = "Brown",
                CreatedAt = DateTime.UtcNow,
            },
        };

        context.Users.AddRange(users);
        context.SaveChanges();
    }
}
