using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddUserMilestones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserMilestones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    MilestoneKey = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false),
                    ProgressValue = table.Column<int>(type: "int", nullable: false),
                    UnlockedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMilestones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMilestones_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UserMilestones_UserId_MilestoneKey",
                table: "UserMilestones",
                columns: new[] { "UserId", "MilestoneKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserMilestones_UserId_UnlockedAtUtc",
                table: "UserMilestones",
                columns: new[] { "UserId", "UnlockedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserMilestones");
        }
    }
}
