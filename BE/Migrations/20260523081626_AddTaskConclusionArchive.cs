using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskConclusionArchive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConcludedAtUtc",
                table: "Tasks",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConcludedByUserId",
                table: "Tasks",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_BoardId_ConcludedAtUtc",
                table: "Tasks",
                columns: new[] { "BoardId", "ConcludedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_ConcludedByUserId",
                table: "Tasks",
                column: "ConcludedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_ConcludedByUserId",
                table: "Tasks",
                column: "ConcludedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_ConcludedByUserId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_BoardId_ConcludedAtUtc",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_ConcludedByUserId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ConcludedAtUtc",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ConcludedByUserId",
                table: "Tasks");
        }
    }
}
