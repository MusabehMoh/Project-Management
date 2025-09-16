using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMA.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Team_Departments_DepartmentId",
                table: "Team");

            migrationBuilder.DropForeignKey(
                name: "FK_Team_Employees_PrsId",
                table: "Team");

            migrationBuilder.DropForeignKey(
                name: "FK_Team_Users_CreatedBy",
                table: "Team");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Team",
                table: "Team");

            migrationBuilder.RenameTable(
                name: "Team",
                newName: "Teams");

            migrationBuilder.RenameIndex(
                name: "IX_Team_PrsId",
                table: "Teams",
                newName: "IX_Teams_PrsId");

            migrationBuilder.RenameIndex(
                name: "IX_Team_DepartmentId",
                table: "Teams",
                newName: "IX_Teams_DepartmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Team_CreatedBy",
                table: "Teams",
                newName: "IX_Teams_CreatedBy");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Teams",
                table: "Teams",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_Departments_DepartmentId",
                table: "Teams",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_Employees_PrsId",
                table: "Teams",
                column: "PrsId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_Users_CreatedBy",
                table: "Teams",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teams_Departments_DepartmentId",
                table: "Teams");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_Employees_PrsId",
                table: "Teams");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_Users_CreatedBy",
                table: "Teams");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Teams",
                table: "Teams");

            migrationBuilder.RenameTable(
                name: "Teams",
                newName: "Team");

            migrationBuilder.RenameIndex(
                name: "IX_Teams_PrsId",
                table: "Team",
                newName: "IX_Team_PrsId");

            migrationBuilder.RenameIndex(
                name: "IX_Teams_DepartmentId",
                table: "Team",
                newName: "IX_Team_DepartmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Teams_CreatedBy",
                table: "Team",
                newName: "IX_Team_CreatedBy");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Team",
                table: "Team",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Team_Departments_DepartmentId",
                table: "Team",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Team_Employees_PrsId",
                table: "Team",
                column: "PrsId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Team_Users_CreatedBy",
                table: "Team",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
