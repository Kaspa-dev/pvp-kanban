using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AlignPlanningPokerParticipantIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlanningPokerParticipants_SessionId",
                table: "PlanningPokerParticipants");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerParticipants_UserId",
                table: "PlanningPokerParticipants",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PlanningPokerParticipants_UserId",
                table: "PlanningPokerParticipants");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerParticipants_SessionId",
                table: "PlanningPokerParticipants",
                column: "SessionId");
        }
    }
}
