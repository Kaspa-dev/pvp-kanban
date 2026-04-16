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

    // Board & Task related tables
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<BoardMembership> BoardMemberships => Set<BoardMembership>();
    public DbSet<PlanningPokerSession> PlanningPokerSessions => Set<PlanningPokerSession>();
    public DbSet<PlanningPokerSessionTask> PlanningPokerSessionTasks => Set<PlanningPokerSessionTask>();
    public DbSet<PlanningPokerParticipant> PlanningPokerParticipants => Set<PlanningPokerParticipant>();
    public DbSet<PlanningPokerVote> PlanningPokerVotes => Set<PlanningPokerVote>();
    public DbSet<BE.Models.Task> Tasks => Set<BE.Models.Task>();
    public DbSet<BE.Models.TaskStatus> TaskStatuses => Set<BE.Models.TaskStatus>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<LabeledTask> LabeledTasks => Set<LabeledTask>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User & OU tables (and Board table)
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(32);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(254);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(32);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(32);
            entity.Property(e => e.PreferencesJson).HasColumnType("longtext");
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TokenHash).IsRequired().HasMaxLength(64);
            entity.Property(e => e.ReplacedByTokenHash).HasMaxLength(64);
            entity.Property(e => e.CreatedAtUtc).IsRequired();
            entity.Property(e => e.ExpiresAtUtc).IsRequired();
            entity.HasIndex(e => e.TokenHash).IsUnique();
            entity.HasIndex(e => new { e.UserId, e.ExpiresAtUtc });

            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Board>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(128);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.LogoIconKey).IsRequired().HasMaxLength(32);
            entity.Property(e => e.LogoColorKey).IsRequired().HasMaxLength(32);
            entity.Property(e => e.CreatedAt).IsRequired();

            entity.HasOne(e => e.Creator)
                .WithMany(u => u.Boards)
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PlanningPokerSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.JoinToken).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(16);
            entity.Property(e => e.CreatedAtUtc).IsRequired();
            entity.Property(e => e.UpdatedAtUtc).IsRequired();
            entity.HasIndex(e => e.JoinToken).IsUnique();

            entity.HasOne(e => e.Board)
                .WithMany(b => b.PlanningPokerSessions)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.HostUser)
                .WithMany()
                .HasForeignKey(e => e.HostUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PlanningPokerSessionTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RoundState).IsRequired().HasMaxLength(16);
            entity.HasIndex(e => new { e.SessionId, e.TaskId }).IsUnique();
            entity.HasIndex(e => new { e.SessionId, e.Position }).IsUnique();
        });

        modelBuilder.Entity<PlanningPokerParticipant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(80);
            entity.Property(e => e.ParticipantToken).HasMaxLength(64);
            entity.HasIndex(e => new { e.SessionId, e.UserId }).IsUnique();
            entity.HasIndex(e => new { e.SessionId, e.ParticipantToken }).IsUnique();
        });

        modelBuilder.Entity<PlanningPokerVote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SessionTaskId, e.ParticipantId }).IsUnique();
        });

        modelBuilder.Entity<BoardMembership>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Role)
                .HasConversion<string>()
                .HasMaxLength(20);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(32);
            entity.HasIndex(e => new { e.BoardId, e.UserId }).IsUnique();

            entity.HasOne(e => e.Board)
                .WithMany(b => b.Memberships)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.BoardMemberships)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
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

            entity.HasOne(e => e.Board)
                .WithMany(b => b.Teams)
                .HasForeignKey(e => e.BoardId)
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

        // Board & Task related tables (except for Board)
        modelBuilder.Entity<BE.Models.TaskStatus>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(32);
            entity.HasIndex(e => new { e.BoardId, e.Title }).IsUnique();

            entity.HasOne(e => e.Board)
                .WithMany(b => b.TaskStatuses)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Label>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Color).IsRequired().HasMaxLength(32);

            entity.HasOne(e => e.Board)
                .WithMany(b => b.Labels)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BE.Models.Task>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(128);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.StoryPoints);
            entity.Property(e => e.IsQueued).HasDefaultValue(false);
            entity.Property(e => e.Priority)
                .HasConversion<string>()
                .HasMaxLength(16);
            entity.Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(16);
            entity.Property(e => e.DueDate);

            entity.HasOne(e => e.Board)
                .WithMany(b => b.Backlog)
                .HasForeignKey(e => e.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Status)
                .WithMany(ts => ts.Tasks)
                .HasForeignKey(e => e.StatusId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(e => e.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);
            
            entity.HasOne(e => e.Reporter)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(e => e.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.AssignedTeam)
                .WithMany(ou => ou.AssignedTasks)
                .HasForeignKey(e => e.TeamId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<LabeledTask>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.LabelId, e.TaskId }).IsUnique();

            entity.HasOne(e => e.Label)
                .WithMany(l => l.LabeledTasks)
                .HasForeignKey(e => e.LabelId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Task)
                .WithMany(t => t.LabeledTasks)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(255);

            entity.HasOne(e => e.Creator)
                .WithMany(u => u.Comments)
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Task)
                .WithMany(t => t.Comments)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired().HasMaxLength(255);

            entity.HasOne(e => e.Comment)
                .WithMany(c => c.Attachments)
                .HasForeignKey(e => e.CommentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
