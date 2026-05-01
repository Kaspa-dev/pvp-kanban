using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class ExpandTaskCommentsForDetailsPage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @drop_fk_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.TABLE_CONSTRAINTS
                            WHERE CONSTRAINT_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND CONSTRAINT_NAME = 'FK_Comments_Users_CreatorId'
                        ),
                        'ALTER TABLE `Comments` DROP FOREIGN KEY `FK_Comments_Users_CreatorId`;',
                        'SELECT 1;'
                    )
                );
                PREPARE drop_fk_stmt FROM @drop_fk_sql;
                EXECUTE drop_fk_stmt;
                DEALLOCATE PREPARE drop_fk_stmt;
                """);

            migrationBuilder.Sql("""
                SET @rename_column_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'CreatorId'
                        ) AND NOT EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'AuthorUserId'
                        ),
                        'ALTER TABLE `Comments` RENAME COLUMN `CreatorId` TO `AuthorUserId`;',
                        'SELECT 1;'
                    )
                );
                PREPARE rename_column_stmt FROM @rename_column_sql;
                EXECUTE rename_column_stmt;
                DEALLOCATE PREPARE rename_column_stmt;
                """);

            migrationBuilder.Sql("""
                SET @rename_index_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.STATISTICS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND INDEX_NAME = 'IX_Comments_CreatorId'
                        ) AND NOT EXISTS(
                            SELECT 1
                            FROM information_schema.STATISTICS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND INDEX_NAME = 'IX_Comments_AuthorUserId'
                        ),
                        'ALTER TABLE `Comments` RENAME INDEX `IX_Comments_CreatorId` TO `IX_Comments_AuthorUserId`;',
                        'SELECT 1;'
                    )
                );
                PREPARE rename_index_stmt FROM @rename_index_sql;
                EXECUTE rename_index_stmt;
                DEALLOCATE PREPARE rename_index_stmt;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE `Comments`
                MODIFY COLUMN `Content` varchar(2000) NOT NULL;
                """);

            migrationBuilder.Sql("""
                SET @add_created_at_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'CreatedAt'
                        ),
                        'SELECT 1;',
                        'ALTER TABLE `Comments` ADD COLUMN `CreatedAt` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6);'
                    )
                );
                PREPARE add_created_at_stmt FROM @add_created_at_sql;
                EXECUTE add_created_at_stmt;
                DEALLOCATE PREPARE add_created_at_stmt;
                """);

            migrationBuilder.Sql("""
                UPDATE `Comments`
                SET `CreatedAt` = CURRENT_TIMESTAMP(6)
                WHERE `CreatedAt` IS NULL;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE `Comments`
                MODIFY COLUMN `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
                """);

            migrationBuilder.Sql("""
                SET @add_updated_at_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'UpdatedAt'
                        ),
                        'SELECT 1;',
                        'ALTER TABLE `Comments` ADD COLUMN `UpdatedAt` datetime(6) NULL;'
                    )
                );
                PREPARE add_updated_at_stmt FROM @add_updated_at_sql;
                EXECUTE add_updated_at_stmt;
                DEALLOCATE PREPARE add_updated_at_stmt;
                """);

            migrationBuilder.Sql("""
                SET @create_comment_index_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.STATISTICS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND INDEX_NAME = 'IX_Comments_TaskId_CreatedAt'
                        ),
                        'SELECT 1;',
                        'CREATE INDEX `IX_Comments_TaskId_CreatedAt` ON `Comments` (`TaskId`, `CreatedAt`);'
                    )
                );
                PREPARE create_comment_index_stmt FROM @create_comment_index_sql;
                EXECUTE create_comment_index_stmt;
                DEALLOCATE PREPARE create_comment_index_stmt;
                """);

            migrationBuilder.Sql("""
                SET @add_author_fk_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.TABLE_CONSTRAINTS
                            WHERE CONSTRAINT_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND CONSTRAINT_NAME = 'FK_Comments_Users_AuthorUserId'
                        ),
                        'SELECT 1;',
                        'ALTER TABLE `Comments` ADD CONSTRAINT `FK_Comments_Users_AuthorUserId` FOREIGN KEY (`AuthorUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE;'
                    )
                );
                PREPARE add_author_fk_stmt FROM @add_author_fk_sql;
                EXECUTE add_author_fk_stmt;
                DEALLOCATE PREPARE add_author_fk_stmt;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                SET @drop_author_fk_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.TABLE_CONSTRAINTS
                            WHERE CONSTRAINT_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND CONSTRAINT_NAME = 'FK_Comments_Users_AuthorUserId'
                        ),
                        'ALTER TABLE `Comments` DROP FOREIGN KEY `FK_Comments_Users_AuthorUserId`;',
                        'SELECT 1;'
                    )
                );
                PREPARE drop_author_fk_stmt FROM @drop_author_fk_sql;
                EXECUTE drop_author_fk_stmt;
                DEALLOCATE PREPARE drop_author_fk_stmt;
                """);

            migrationBuilder.Sql("""
                SET @drop_comment_index_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.STATISTICS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND INDEX_NAME = 'IX_Comments_TaskId_CreatedAt'
                        ),
                        'DROP INDEX `IX_Comments_TaskId_CreatedAt` ON `Comments`;',
                        'SELECT 1;'
                    )
                );
                PREPARE drop_comment_index_stmt FROM @drop_comment_index_sql;
                EXECUTE drop_comment_index_stmt;
                DEALLOCATE PREPARE drop_comment_index_stmt;
                """);

            migrationBuilder.Sql("""
                SET @drop_created_at_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'CreatedAt'
                        ),
                        'ALTER TABLE `Comments` DROP COLUMN `CreatedAt`;',
                        'SELECT 1;'
                    )
                );
                PREPARE drop_created_at_stmt FROM @drop_created_at_sql;
                EXECUTE drop_created_at_stmt;
                DEALLOCATE PREPARE drop_created_at_stmt;
                """);

            migrationBuilder.Sql("""
                SET @drop_updated_at_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'UpdatedAt'
                        ),
                        'ALTER TABLE `Comments` DROP COLUMN `UpdatedAt`;',
                        'SELECT 1;'
                    )
                );
                PREPARE drop_updated_at_stmt FROM @drop_updated_at_sql;
                EXECUTE drop_updated_at_stmt;
                DEALLOCATE PREPARE drop_updated_at_stmt;
                """);

            migrationBuilder.Sql("""
                SET @rename_author_index_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.STATISTICS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND INDEX_NAME = 'IX_Comments_AuthorUserId'
                        ) AND NOT EXISTS(
                            SELECT 1
                            FROM information_schema.STATISTICS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND INDEX_NAME = 'IX_Comments_CreatorId'
                        ),
                        'ALTER TABLE `Comments` RENAME INDEX `IX_Comments_AuthorUserId` TO `IX_Comments_CreatorId`;',
                        'SELECT 1;'
                    )
                );
                PREPARE rename_author_index_stmt FROM @rename_author_index_sql;
                EXECUTE rename_author_index_stmt;
                DEALLOCATE PREPARE rename_author_index_stmt;
                """);

            migrationBuilder.Sql("""
                SET @rename_author_column_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'AuthorUserId'
                        ) AND NOT EXISTS(
                            SELECT 1
                            FROM information_schema.COLUMNS
                            WHERE TABLE_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND COLUMN_NAME = 'CreatorId'
                        ),
                        'ALTER TABLE `Comments` RENAME COLUMN `AuthorUserId` TO `CreatorId`;',
                        'SELECT 1;'
                    )
                );
                PREPARE rename_author_column_stmt FROM @rename_author_column_sql;
                EXECUTE rename_author_column_stmt;
                DEALLOCATE PREPARE rename_author_column_stmt;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE `Comments`
                MODIFY COLUMN `Content` varchar(255) NOT NULL;
                """);

            migrationBuilder.Sql("""
                SET @add_creator_fk_sql = (
                    SELECT IF(
                        EXISTS(
                            SELECT 1
                            FROM information_schema.TABLE_CONSTRAINTS
                            WHERE CONSTRAINT_SCHEMA = DATABASE()
                              AND TABLE_NAME = 'Comments'
                              AND CONSTRAINT_NAME = 'FK_Comments_Users_CreatorId'
                        ),
                        'SELECT 1;',
                        'ALTER TABLE `Comments` ADD CONSTRAINT `FK_Comments_Users_CreatorId` FOREIGN KEY (`CreatorId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE;'
                    )
                );
                PREPARE add_creator_fk_stmt FROM @add_creator_fk_sql;
                EXECUTE add_creator_fk_stmt;
                DEALLOCATE PREPARE add_creator_fk_stmt;
                """);
        }
    }
}
