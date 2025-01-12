using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace stinsily.Server.Migrations
{
    /// <inheritdoc />
    public partial class iterms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ImageURL",
                table: "Scenes",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddColumn<int>(
                name: "ItemID",
                table: "Scenes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 1,
                column: "ItemID",
                value: null);

            migrationBuilder.UpdateData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 2,
                column: "ItemID",
                value: null);

            migrationBuilder.UpdateData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 3,
                column: "ItemID",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_Scenes_ItemID",
                table: "Scenes",
                column: "ItemID");

            migrationBuilder.AddForeignKey(
                name: "FK_Scenes_Items_ItemID",
                table: "Scenes",
                column: "ItemID",
                principalTable: "Items",
                principalColumn: "ItemID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Scenes_Items_ItemID",
                table: "Scenes");

            migrationBuilder.DropIndex(
                name: "IX_Scenes_ItemID",
                table: "Scenes");

            migrationBuilder.DropColumn(
                name: "ItemID",
                table: "Scenes");

            migrationBuilder.AlterColumn<string>(
                name: "ImageURL",
                table: "Scenes",
                type: "TEXT",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
