using BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations;

[Migration("20260505120000_AddTaskColumnPosition")]
[DbContext(typeof(AppDbContext))]
public partial class AddTaskColumnPosition : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ColumnPosition",
            table: "Tasks",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.Sql("""
            UPDATE Tasks
            JOIN (
                SELECT
                    Id,
                    ROW_NUMBER() OVER (PARTITION BY BoardId, StatusId ORDER BY Id DESC) - 1 AS PositionValue
                FROM Tasks
            ) OrderedTasks ON OrderedTasks.Id = Tasks.Id
            SET Tasks.ColumnPosition = OrderedTasks.PositionValue;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ColumnPosition",
            table: "Tasks");
    }
}
