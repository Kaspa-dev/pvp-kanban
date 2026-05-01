using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations;

[Migration("20260501120000_SetDoneColumnHardLimitDefault")]
public partial class SetDoneColumnHardLimitDefault : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE BoardColumnLimits
            SET
                SoftLimit = COALESCE(SoftLimit, 20),
                HardLimit = COALESCE(HardLimit, 20)
            WHERE StatusKey = 'done'
                AND (SoftLimit IS NULL OR HardLimit IS NULL);
            """);

        migrationBuilder.Sql("""
            INSERT INTO BoardColumnLimits (BoardId, StatusKey, SoftLimit, HardLimit)
            SELECT Id, 'done', 20, 20
            FROM Boards
            WHERE NOT EXISTS (
                SELECT 1
                FROM BoardColumnLimits
                WHERE BoardColumnLimits.BoardId = Boards.Id
                    AND BoardColumnLimits.StatusKey = 'done'
            );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE BoardColumnLimits
            SET SoftLimit = NULL, HardLimit = NULL
            WHERE StatusKey = 'done' AND SoftLimit = 20 AND HardLimit = 20;
            """);
    }
}
