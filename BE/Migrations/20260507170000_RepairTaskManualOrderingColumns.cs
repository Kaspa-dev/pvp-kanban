using BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations;

[Migration("20260507170000_RepairTaskManualOrderingColumns")]
[DbContext(typeof(AppDbContext))]
public partial class RepairTaskManualOrderingColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        AddColumnIfMissing(migrationBuilder, "Tasks", "ColumnPosition", "`ColumnPosition` int NOT NULL DEFAULT 0");
        AddColumnIfMissing(migrationBuilder, "Tasks", "StatusEnteredAtUtc", "`StatusEnteredAtUtc` datetime(6) NULL");

        migrationBuilder.Sql(
            """
            UPDATE Tasks
            JOIN (
                SELECT
                    Id,
                    ROW_NUMBER() OVER (PARTITION BY BoardId, StatusId ORDER BY Id DESC) - 1 AS PositionValue
                FROM Tasks
            ) OrderedTasks ON OrderedTasks.Id = Tasks.Id
            SET Tasks.ColumnPosition = OrderedTasks.PositionValue
            WHERE Tasks.ColumnPosition = 0
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        DropColumnIfExists(migrationBuilder, "Tasks", "StatusEnteredAtUtc");
        DropColumnIfExists(migrationBuilder, "Tasks", "ColumnPosition");
    }

    private static void AddColumnIfMissing(
        MigrationBuilder migrationBuilder,
        string tableName,
        string columnName,
        string columnDefinition)
    {
        string escapedColumnDefinition = columnDefinition.Replace("'", "''");

        migrationBuilder.Sql(
            $"""
            SET @column_exists := (
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = '{tableName}'
                  AND COLUMN_NAME = '{columnName}'
            )
            """);

        migrationBuilder.Sql(
            $"""
            SET @add_statement := IF(
                @column_exists = 0,
                'ALTER TABLE `{tableName}` ADD COLUMN {escapedColumnDefinition}',
                'SELECT 1'
            )
            """);

        migrationBuilder.Sql("PREPARE migration_stmt FROM @add_statement");
        migrationBuilder.Sql("EXECUTE migration_stmt");
        migrationBuilder.Sql("DEALLOCATE PREPARE migration_stmt");
    }

    private static void DropColumnIfExists(MigrationBuilder migrationBuilder, string tableName, string columnName)
    {
        migrationBuilder.Sql(
            $"""
            SET @column_exists := (
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = '{tableName}'
                  AND COLUMN_NAME = '{columnName}'
            )
            """);

        migrationBuilder.Sql(
            $"""
            SET @drop_statement := IF(
                @column_exists > 0,
                'ALTER TABLE `{tableName}` DROP COLUMN `{columnName}`',
                'SELECT 1'
            )
            """);

        migrationBuilder.Sql("PREPARE migration_stmt FROM @drop_statement");
        migrationBuilder.Sql("EXECUTE migration_stmt");
        migrationBuilder.Sql("DEALLOCATE PREPARE migration_stmt");
    }
}
