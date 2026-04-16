using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanningPoker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlanningPokerSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    BoardId = table.Column<int>(type: "int", nullable: false),
                    HostUserId = table.Column<int>(type: "int", nullable: false),
                    JoinToken = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false),
                    Status = table.Column<string>(type: "varchar(16)", maxLength: 16, nullable: false),
                    ActiveSessionTaskId = table.Column<int>(type: "int", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerSessions_Boards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "Boards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanningPokerSessions_Users_HostUserId",
                        column: x => x.HostUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PlanningPokerParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    ParticipantToken = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: true),
                    DisplayName = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false),
                    IsHost = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsGuest = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    LastSeenAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerParticipants_PlanningPokerSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "PlanningPokerSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanningPokerParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PlanningPokerSessionTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    SessionId = table.Column<int>(type: "int", nullable: false),
                    TaskId = table.Column<int>(type: "int", nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    RoundState = table.Column<string>(type: "varchar(16)", maxLength: 16, nullable: false),
                    RecommendedStoryPoints = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerSessionTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerSessionTasks_PlanningPokerSessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "PlanningPokerSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanningPokerSessionTasks_Tasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "Tasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PlanningPokerVotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    SessionTaskId = table.Column<int>(type: "int", nullable: false),
                    ParticipantId = table.Column<int>(type: "int", nullable: false),
                    CardValue = table.Column<int>(type: "int", nullable: false),
                    SubmittedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanningPokerVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanningPokerVotes_PlanningPokerParticipants_ParticipantId",
                        column: x => x.ParticipantId,
                        principalTable: "PlanningPokerParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanningPokerVotes_PlanningPokerSessionTasks_SessionTaskId",
                        column: x => x.SessionTaskId,
                        principalTable: "PlanningPokerSessionTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerParticipants_SessionId",
                table: "PlanningPokerParticipants",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerParticipants_SessionId_UserId",
                table: "PlanningPokerParticipants",
                columns: new[] { "SessionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerParticipants_SessionId_ParticipantToken",
                table: "PlanningPokerParticipants",
                columns: new[] { "SessionId", "ParticipantToken" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerSessions_BoardId",
                table: "PlanningPokerSessions",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerSessions_HostUserId",
                table: "PlanningPokerSessions",
                column: "HostUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerSessions_JoinToken",
                table: "PlanningPokerSessions",
                column: "JoinToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerSessionTasks_SessionId_Position",
                table: "PlanningPokerSessionTasks",
                columns: new[] { "SessionId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerSessionTasks_SessionId_TaskId",
                table: "PlanningPokerSessionTasks",
                columns: new[] { "SessionId", "TaskId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerSessionTasks_TaskId",
                table: "PlanningPokerSessionTasks",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerVotes_ParticipantId",
                table: "PlanningPokerVotes",
                column: "ParticipantId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanningPokerVotes_SessionTaskId_ParticipantId",
                table: "PlanningPokerVotes",
                columns: new[] { "SessionTaskId", "ParticipantId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanningPokerVotes");

            migrationBuilder.DropTable(
                name: "PlanningPokerParticipants");

            migrationBuilder.DropTable(
                name: "PlanningPokerSessionTasks");

            migrationBuilder.DropTable(
                name: "PlanningPokerSessions");
        }
    }
}
