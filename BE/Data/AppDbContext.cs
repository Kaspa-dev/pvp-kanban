using BE.Models;
using Microsoft.EntityFrameworkCore;

namespace BE.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // User & OU tables
    public DbSet<User> Users => Set<User>();
    public DbSet<OrganizationalUnit> OrganizationalUnits => Set<OrganizationalUnit>();
    public DbSet<OrganizationalUnitMember> OrganizationalUnitMembers => Set<OrganizationalUnitMember>();

    //Board & Task tables

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(32);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(254);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(32);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(32);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<OrganizationalUnit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(16);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.Code).IsUnique();

            // Full-text index on Name recommended by the PDF spec
            entity.HasIndex(e => e.Name).HasDatabaseName("IX_OrganizationalUnits_Name_FullText");

            entity.HasOne(e => e.Owner)
                .WithMany(u => u.OwnedUnits)
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrganizationalUnitMember>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.Property(e => e.Status)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.Property(e => e.InvitedAt).IsRequired();

            entity.HasIndex(e => new { e.OrganizationalUnitId, e.UserId }).IsUnique();

            entity.HasOne(e => e.OrganizationalUnit)
                .WithMany(ou => ou.Members)
                .HasForeignKey(e => e.OrganizationalUnitId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Memberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
