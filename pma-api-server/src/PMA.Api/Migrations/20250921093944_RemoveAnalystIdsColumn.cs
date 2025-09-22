using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMA.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAnalystIdsColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnalystIds",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Lookups");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Lookups");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "Lookups");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Lookups");

            migrationBuilder.RenameColumn(
                name: "Label",
                table: "Lookups",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Lookups",
                newName: "Code");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Units",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Level",
                table: "Units",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "Units",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Path",
                table: "Units",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Value",
                table: "Lookups",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "NameAr",
                table: "Lookups",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProjectAnalysts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    AnalystId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectAnalysts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectAnalysts_Employees_AnalystId",
                        column: x => x.AnalystId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectAnalysts_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Units_ParentId",
                table: "Units",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAnalysts_AnalystId",
                table: "ProjectAnalysts",
                column: "AnalystId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAnalysts_ProjectId",
                table: "ProjectAnalysts",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Units_Units_ParentId",
                table: "Units",
                column: "ParentId",
                principalTable: "Units",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Units_Units_ParentId",
                table: "Units");

            migrationBuilder.DropTable(
                name: "ProjectAnalysts");

            migrationBuilder.DropIndex(
                name: "IX_Units_ParentId",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "Path",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "NameAr",
                table: "Lookups");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Lookups",
                newName: "Label");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "Lookups",
                newName: "Category");

            migrationBuilder.AddColumn<string>(
                name: "AnalystIds",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Value",
                table: "Lookups",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Lookups",
                type: "nvarchar(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Lookups",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "Lookups",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Lookups",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
