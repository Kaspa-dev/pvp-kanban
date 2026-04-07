using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardPersistencePhase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            DropForeignKeyIfExists(migrationBuilder, "Boards", "FK_Boards_Users_CreatorId");
            DropForeignKeyIfExists(migrationBuilder, "Tasks", "FK_Tasks_OrganizationalUnits_TeamId");
            DropForeignKeyIfExists(migrationBuilder, "Tasks", "FK_Tasks_Sprints_SprintId");
            DropForeignKeyIfExists(migrationBuilder, "Tasks", "FK_Tasks_Users_AssigneeId");
            DropForeignKeyIfExists(migrationBuilder, "Tasks", "FK_Tasks_Users_ReporterId");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Tasks",
                type: "varchar(16)",
                maxLength: 16,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Tasks",
                type: "varchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldMaxLength: 32);

            migrationBuilder.AlterColumn<string>(
                name: "Priority",
                table: "Tasks",
                type: "varchar(16)",
                maxLength: 16,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Tasks",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldMaxLength: 255);

            AddColumnIfMissing(
                migrationBuilder,
                "Tasks",
                "DueDate",
                "`DueDate` datetime(6) NULL");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Sprints",
                type: "varchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldMaxLength: 32);

            AddColumnIfMissing(
                migrationBuilder,
                "Sprints",
                "CompletedAt",
                "`CompletedAt` datetime(6) NULL");

            AddColumnIfMissing(
                migrationBuilder,
                "Sprints",
                "CreatedAt",
                "`CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");

            AddColumnIfMissing(
                migrationBuilder,
                "Sprints",
                "Status",
                "`Status` varchar(20) NOT NULL DEFAULT 'planned'");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Labels",
                type: "varchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldMaxLength: 32);

            AddColumnIfMissing(
                migrationBuilder,
                "Labels",
                "Color",
                "`Color` varchar(32) NOT NULL DEFAULT '#64748b'");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Boards",
                type: "varchar(128)",
                maxLength: 128,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(32)",
                oldMaxLength: 32);

            AddColumnIfMissing(
                migrationBuilder,
                "Boards",
                "CreatedAt",
                "`CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");

            AddColumnIfMissing(
                migrationBuilder,
                "Boards",
                "Description",
                "`Description` varchar(500) NOT NULL DEFAULT ''");

            migrationBuilder.CreateTable(
                name: "BoardMemberships",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    BoardId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Role = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    Color = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardMemberships_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BoardMemberships_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TaskStatuses_BoardId_Title",
                table: "TaskStatuses",
                columns: new[] { "BoardId", "Title" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardMemberships_BoardId_UserId",
                table: "BoardMemberships",
                columns: new[] { "BoardId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BoardMemberships_UserId",
                table: "BoardMemberships",
                column: "UserId");

            migrationBuilder.Sql(
                """
                INSERT INTO `BoardMemberships` (`BoardId`, `UserId`, `Role`, `Color`)
                SELECT `b`.`Id`, `b`.`CreatorId`, 'Owner', '#3b82f6'
                FROM `Boards` AS `b`
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM `BoardMemberships` AS `bm`
                    WHERE `bm`.`BoardId` = `b`.`Id`
                      AND `bm`.`UserId` = `b`.`CreatorId`
                );
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_Boards_Users_CreatorId",
                table: "Boards",
                column: "CreatorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_OrganizationalUnits_TeamId",
                table: "Tasks",
                column: "TeamId",
                principalTable: "OrganizationalUnits",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Sprints_SprintId",
                table: "Tasks",
                column: "SprintId",
                principalTable: "Sprints",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_AssigneeId",
                table: "Tasks",
                column: "AssigneeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_ReporterId",
                table: "Tasks",
                column: "ReporterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Boards_Users_CreatorId",
                table: "Boards");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_OrganizationalUnits_TeamId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Sprints_SprintId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_AssigneeId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_ReporterId",
                table: "Tasks");

            migrationBuilder.DropTable(
                name: "BoardMemberships");

            migrationBuilder.DropIndex(
                name: "IX_TaskStatuses_BoardId_Title",
                table: "TaskStatuses");

            migrationBuilder.DropColumn(
                name: "DueDate",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Labels");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Boards");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Boards");

            migrationBuilder.AlterColumn<string>(
                name: "Type",
                table: "Tasks",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Tasks",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(128)",
                oldMaxLength: 128);

            migrationBuilder.AlterColumn<string>(
                name: "Priority",
                table: "Tasks",
                type: "varchar(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Tasks",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Sprints",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(128)",
                oldMaxLength: 128);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Labels",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Boards",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(128)",
                oldMaxLength: 128);

            migrationBuilder.AddForeignKey(
                name: "FK_Boards_Users_CreatorId",
                table: "Boards",
                column: "CreatorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_OrganizationalUnits_TeamId",
                table: "Tasks",
                column: "TeamId",
                principalTable: "OrganizationalUnits",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Sprints_SprintId",
                table: "Tasks",
                column: "SprintId",
                principalTable: "Sprints",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_AssigneeId",
                table: "Tasks",
                column: "AssigneeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_ReporterId",
                table: "Tasks",
                column: "ReporterId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        private static void DropForeignKeyIfExists(MigrationBuilder migrationBuilder, string tableName, string foreignKeyName)
        {
            migrationBuilder.Sql(
                $"""
                SET @constraint_exists := (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE()
                      AND TABLE_NAME = '{tableName}'
                      AND CONSTRAINT_NAME = '{foreignKeyName}'
                      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                )
                """);

            migrationBuilder.Sql(
                $"""
                SET @drop_statement := IF(
                    @constraint_exists > 0,
                    'ALTER TABLE `{tableName}` DROP FOREIGN KEY `{foreignKeyName}`',
                    'SELECT 1'
                )
                """);

            migrationBuilder.Sql("PREPARE migration_stmt FROM @drop_statement");
            migrationBuilder.Sql("EXECUTE migration_stmt");
            migrationBuilder.Sql("DEALLOCATE PREPARE migration_stmt");
        }

        private static void AddColumnIfMissing(MigrationBuilder migrationBuilder, string tableName, string columnName, string columnDefinition)
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

    }
}
