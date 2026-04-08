using BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BE.Migrations
{
    /// <inheritdoc />
    public partial class AddBoardLogos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoColorKey",
                table: "Boards",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "slate");

            migrationBuilder.AddColumn<string>(
                name: "LogoIconKey",
                table: "Boards",
                type: "varchar(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "folder");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoColorKey",
                table: "Boards");

            migrationBuilder.DropColumn(
                name: "LogoIconKey",
                table: "Boards");
        }
    }
}
