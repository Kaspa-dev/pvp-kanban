using BE.Models;
using BE.Services;

namespace BE.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (!context.Users.Any())
        {
            // ── Users ────────────────────────────────────────────────────────────
            var alicePassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_ALICE") ?? "ChangeMe@1";
            var bobPassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_BOB") ?? "ChangeMe@2";
            var charliePassword = Environment.GetEnvironmentVariable("SEED_PASSWORD_CHARLIE") ?? "ChangeMe@3";

            var alice = new User
            {
                Username = "alice_smith",
                Email = "alice@example.com",
                PasswordHash = PasswordHasher.HashPassword(alicePassword),
                FirstName = "Alice",
                LastName = "Smith",
                CreatedAt = DateTime.UtcNow,
                LastLogin = DateTime.UtcNow
            };
            var bob = new User
            {
                Username = "bob_jones",
                Email = "bob@example.com",
                PasswordHash = PasswordHasher.HashPassword(bobPassword),
                FirstName = "Bob",
                LastName = "Jones",
                CreatedAt = DateTime.UtcNow
            };
            var charlie = new User
            {
                Username = "charlie_brown",
                Email = "charlie@example.com",
                PasswordHash = PasswordHasher.HashPassword(charliePassword),
                FirstName = "Charlie",
                LastName = "Brown",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(alice, bob, charlie);
            context.SaveChanges();

            // ── Boards ───────────────────────────────────────────────────────
            var board1 = new Board
            {
                Title = "Board1",
                CreatorId = alice.Id
            };

            context.Boards.AddRange(board1);
            context.SaveChanges();

            // ── Organizational Units ─────────────────────────────────────────────
            var engineering = new OrganizationalUnit
            {
                Name = "Engineering",
                Code = "ENG",
                OwnerId = alice.Id,
                CreatedAt = DateTime.UtcNow,
                BoardId = board1.Id
            };
            var product = new OrganizationalUnit
            {
                Name = "Product",
                Code = "PROD",
                OwnerId = bob.Id,
                CreatedAt = DateTime.UtcNow,
                BoardId = board1.Id
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

            // ── Sprints ───────────────────────────────────────────────────────
            var sprint1 = new Sprint
            {
                Title = "Sprint1",
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(14),
                BoardId = board1.Id
            };

            context.Sprints.AddRange(sprint1);
            context.SaveChanges();

            // ── TaskStatuses ───────────────────────────────────────────────────────
            var status1 = new BE.Models.TaskStatus
            {
                Title = "To do",
                BoardId = board1.Id
            };

            context.TaskStatuses.AddRange(status1);
            context.SaveChanges();

            // ── Labels ───────────────────────────────────────────────────────
            var label1 = new Label
            {
                Title = "Programming",
                BoardId = board1.Id
            };

            context.Labels.AddRange(label1);
            context.SaveChanges();

            // ── Tasks ───────────────────────────────────────────────────────
            var task1 = new BE.Models.Task
            {
                Title = "Programming task",
                Description = "Do this programming task",
                StoryPoints = 1,
                BoardId = board1.Id,
                StatusId = status1.Id,
                AssigneeId = alice.Id,
                ReporterId = alice.Id,
                SprintId = sprint1.Id,
                Priority = BE.Models.Priority.Low,
                Type = BE.Models.Type.Story 
            };

            context.Tasks.AddRange(task1);
            context.SaveChanges();

            // ── LabeledTasks (solving many to many relation) ───────────────
            var labeledTask1 = new LabeledTask
            {
                LabelId = label1.Id,
                TaskId = task1.Id
            };

            context.LabeledTasks.AddRange(labeledTask1);
            context.SaveChanges();

            // ── Comments ───────────────────────────────────────────────────────
            var comment1 = new Comment
            {
                Content = "Is this how I'm supposed to do the task?",
                CreatorId = alice.Id,
                TaskId = task1.Id
            };

            context.Comments.AddRange(comment1);
            context.SaveChanges();

            // ── Attachments ───────────────────────────────────────────────────────
            var attachment1 = new BE.Models.Attachment
            {
                Content = "url",
                CommentId = comment1.Id
            };

            context.Attachments.AddRange(attachment1);
            context.SaveChanges();
        }

        context.SaveChanges();
    }
}
