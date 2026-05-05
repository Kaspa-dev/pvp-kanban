using System;
using BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace BE.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260503103000_AddUserMilestoneEvents")]
    public class AddUserMilestoneEvents : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserMilestoneEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    EventType = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false),
                    EventKey = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserMilestoneEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserMilestoneEvents_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_UserMilestoneEvents_EventType_EventKey",
                table: "UserMilestoneEvents",
                columns: new[] { "EventType", "EventKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserMilestoneEvents_UserId_EventType",
                table: "UserMilestoneEvents",
                columns: new[] { "UserId", "EventType" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserMilestoneEvents");
        }
    }
}
