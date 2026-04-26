using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddGamificationXpEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "XpEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    BoardId = table.Column<int>(type: "int", nullable: false),
                    TaskId = table.Column<int>(type: "int", nullable: true),
                    Type = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false),
                    XpAmount = table.Column<int>(type: "int", nullable: false),
                    AwardKey = table.Column<string>(type: "varchar(128)", maxLength: 128, nullable: false),
                    ReversesXpEventId = table.Column<int>(type: "int", nullable: true),
                    SourceSnapshotJson = table.Column<string>(type: "longtext", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_XpEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_XpEvents_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_XpEvents_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_XpEvents_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_XpEvents_XpEvents_ReversesXpEventId",
                        column: x => x.ReversesXpEventId,
                        principalTable: "XpEvents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_XpEvents_AwardKey",
                table: "XpEvents",
                column: "AwardKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_XpEvents_BoardId_CreatedAtUtc",
                table: "XpEvents",
                columns: new[] { "BoardId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_XpEvents_ReversesXpEventId",
                table: "XpEvents",
                column: "ReversesXpEventId");

            migrationBuilder.CreateIndex(
                name: "IX_XpEvents_TaskId",
                table: "XpEvents",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_XpEvents_UserId_CreatedAtUtc",
                table: "XpEvents",
                columns: new[] { "UserId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "XpEvents");
        }
    }
}
