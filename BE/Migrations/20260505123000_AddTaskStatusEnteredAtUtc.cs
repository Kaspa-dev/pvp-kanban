using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations;

[Migration("20260505123000_AddTaskStatusEnteredAtUtc")]
public partial class AddTaskStatusEnteredAtUtc : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "StatusEnteredAtUtc",
            table: "Tasks",
            type: "datetime(6)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "StatusEnteredAtUtc",
            table: "Tasks");
    }
}
