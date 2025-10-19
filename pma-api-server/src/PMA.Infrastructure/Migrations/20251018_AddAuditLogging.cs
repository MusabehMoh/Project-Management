using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditLogging : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChangeGroups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                        .Annotation("SqlServer:IsSparse", false),
                    EntityId = table.Column<int>(type: "int", nullable: false),
                    ChangedBy = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ChangedAt = table.Column<DateTime>(type: "datetime2(7)", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChangeGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChangeItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChangeGroupId = table.Column<int>(type: "int", nullable: false),
                    FieldName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OldValue = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    NewValue = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChangeItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChangeItems_ChangeGroups_ChangeGroupId",
                        column: x => x.ChangeGroupId,
                        principalTable: "ChangeGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChangeGroup_ChangedAt",
                table: "ChangeGroups",
                column: "ChangedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChangeGroup_EntityType_EntityId",
                table: "ChangeGroups",
                columns: new[] { "EntityType", "EntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChangeItems_ChangeGroupId",
                table: "ChangeItems",
                column: "ChangeGroupId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChangeItems");

            migrationBuilder.DropTable(
                name: "ChangeGroups");
        }
    }
}
