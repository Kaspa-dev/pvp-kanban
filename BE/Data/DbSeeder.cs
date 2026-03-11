using BE.Models;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using System.Security.Cryptography;

namespace BE.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (context.Users.Any())
            return;

        // ── Users ────────────────────────────────────────────────────────────
        var alicePassword   = Environment.GetEnvironmentVariable("SEED_PASSWORD_ALICE")   ?? "ChangeMe@1";
        var bobPassword     = Environment.GetEnvironmentVariable("SEED_PASSWORD_BOB")     ?? "ChangeMe@2";
        var charliePassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_CHARLIE") ?? "ChangeMe@3";

        var alice = new User
        {
            Username = "alice_smith",
            Email = "alice@example.com",
            PasswordHash = HashPassword(alicePassword),
            FirstName = "Alice",
            LastName = "Smith",
            CreatedAt = DateTime.UtcNow,
            LastLogin = DateTime.UtcNow
        };
        var bob = new User
        {
            Username = "bob_jones",
            Email = "bob@example.com",
            PasswordHash = HashPassword(bobPassword),
            FirstName = "Bob",
            LastName = "Jones",
            CreatedAt = DateTime.UtcNow
        };
        var charlie = new User
        {
            Username = "charlie_brown",
            Email = "charlie@example.com",
            PasswordHash = HashPassword(charliePassword),
            FirstName = "Charlie",
            LastName = "Brown",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(alice, bob, charlie);
        context.SaveChanges();

        // ── Organizational Units ─────────────────────────────────────────────
        var engineering = new OrganizationalUnit
        {
            Name = "Engineering",
            Code = "ENG",
            OwnerId = alice.Id,
            CreatedAt = DateTime.UtcNow
        };
        var product = new OrganizationalUnit
        {
            Name = "Product",
            Code = "PROD",
            OwnerId = bob.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.OrganizationalUnits.AddRange(engineering, product);
        context.SaveChanges();

        // ── OU Members ───────────────────────────────────────────────────────
        context.OrganizationalUnitMembers.AddRange(
            // Engineering: Alice (Admin/Active), Bob (Member/Active), Charlie (Member/Invited)
            new OrganizationalUnitMember
            {
                OrganizationalUnitId = engineering.Id,
                UserId = alice.Id,
                Role = OuMemberRole.Admin,
                Status = OuMemberStatus.Active,
                InvitedAt = DateTime.UtcNow.AddDays(-10),
                JoinedAt = DateTime.UtcNow.AddDays(-10)
            },
            new OrganizationalUnitMember
            {
                OrganizationalUnitId = engineering.Id,
                UserId = bob.Id,
                Role = OuMemberRole.Member,
                Status = OuMemberStatus.Active,
                InvitedAt = DateTime.UtcNow.AddDays(-7),
                JoinedAt = DateTime.UtcNow.AddDays(-6)
            },
            new OrganizationalUnitMember
            {
                OrganizationalUnitId = engineering.Id,
                UserId = charlie.Id,
                Role = OuMemberRole.Member,
                Status = OuMemberStatus.Invited,
                InvitedAt = DateTime.UtcNow.AddDays(-1)
            },

            // Product: Bob (Admin/Active), Charlie (Member/Active)
            new OrganizationalUnitMember
            {
                OrganizationalUnitId = product.Id,
                UserId = bob.Id,
                Role = OuMemberRole.Admin,
                Status = OuMemberStatus.Active,
                InvitedAt = DateTime.UtcNow.AddDays(-5),
                JoinedAt = DateTime.UtcNow.AddDays(-5)
            },
            new OrganizationalUnitMember
            {
                OrganizationalUnitId = product.Id,
                UserId = charlie.Id,
                Role = OuMemberRole.Member,
                Status = OuMemberStatus.Active,
                InvitedAt = DateTime.UtcNow.AddDays(-3),
                JoinedAt = DateTime.UtcNow.AddDays(-2)
            }
        );

        context.SaveChanges();
    }

    private static string HashPassword(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);
        byte[] hash = KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100_000,
            numBytesRequested: 32);

        // Format: base64(salt) + ":" + base64(hash)
        return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
    }
}
