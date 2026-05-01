using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class PersistBoardColumnLimits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BoardColumnLimits",
                columns: table => new
                {
                    BoardId = table.Column<int>(type: "int", nullable: false),
                    StatusKey = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    SoftLimit = table.Column<int>(type: "int", nullable: true),
                    HardLimit = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardColumnLimits", x => new { x.BoardId, x.StatusKey });
                    table.ForeignKey(
                        name: "FK_BoardColumnLimits_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.Sql("""
                INSERT INTO BoardColumnLimits (BoardId, StatusKey, SoftLimit, HardLimit)
                SELECT Id, 'todo', 8, 12 FROM Boards;
                """);

            migrationBuilder.Sql("""
                INSERT INTO BoardColumnLimits (BoardId, StatusKey, SoftLimit, HardLimit)
                SELECT Id, 'inProgress', 4, 6 FROM Boards;
                """);

            migrationBuilder.Sql("""
                INSERT INTO BoardColumnLimits (BoardId, StatusKey, SoftLimit, HardLimit)
                SELECT Id, 'inReview', 3, 5 FROM Boards;
                """);

            migrationBuilder.Sql("""
                INSERT INTO BoardColumnLimits (BoardId, StatusKey, SoftLimit, HardLimit)
                SELECT Id, 'done', 20, 20 FROM Boards;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardColumnLimits");
        }
    }
}
