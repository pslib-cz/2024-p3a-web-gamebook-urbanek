using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace stinsily.Server.Migrations
{
    /// <inheritdoc />
    public partial class scenesedit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "Scenes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Scenes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 1,
                column: "Type",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 2,
                column: "Type",
                value: 0);

            migrationBuilder.UpdateData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 3,
                column: "Type",
                value: 0);
        }
    }
}
