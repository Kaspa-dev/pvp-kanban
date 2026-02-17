using BE.Models;

namespace BE.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (context.BoardItems.Any())
            return;

        context.BoardItems.AddRange(
            new BoardItem
            {
                Title = "Set up project",
                Description = "Initialize the .NET project and configure dependencies",
                Status = BoardItemStatus.Done,
                CreatedAt = DateTime.UtcNow
            },
            new BoardItem
            {
                Title = "Design database schema",
                Description = "Create entity models and configure EF Core",
                Status = BoardItemStatus.InProgress,
                CreatedAt = DateTime.UtcNow
            },
            new BoardItem
            {
                Title = "Build frontend",
                Description = "Create the Kanban board UI",
                Status = BoardItemStatus.Todo,
                CreatedAt = DateTime.UtcNow
            }
        );

        context.SaveChanges();
    }
}
