using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace stinsily.Server.Migrations
{
    /// <inheritdoc />
    public partial class scene3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ChoicesConnections",
                columns: new[] { "ChoicesConnectionsID", "Effect", "FromSceneSceneID", "MiniGameID", "RequiredItemID", "SceneFromID", "SceneToID", "Text", "ToSceneSceneID" },
                values: new object[] { 2, "podmínený postup", null, 1, 2, 2, 3, "Postup do další místnosti (potřebujete světelný meč)", null });

            migrationBuilder.InsertData(
                table: "Scenes",
                columns: new[] { "SceneID", "ConnectionID", "Description", "Title" },
                values: new object[] { 3, 3, "podmineny postup", "Scena3" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ChoicesConnections",
                keyColumn: "ChoicesConnectionsID",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Scenes",
                keyColumn: "SceneID",
                keyValue: 3);
        }
    }
}
