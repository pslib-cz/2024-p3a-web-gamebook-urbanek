using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace stinsily.Server.Migrations
{
    /// <inheritdoc />
    public partial class first : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Items",
                columns: table => new
                {
                    ItemID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    HealthModifier = table.Column<int>(type: "INTEGER", nullable: false),
                    ForceModifier = table.Column<int>(type: "INTEGER", nullable: false),
                    ObiWanRelationshipModifier = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Items", x => x.ItemID);
                });

            migrationBuilder.CreateTable(
                name: "MiniGames",
                columns: table => new
                {
                    MiniGameID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Description = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiniGames", x => x.MiniGameID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PlayerID = table.Column<int>(type: "INTEGER", nullable: false),
                    UserName = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserID);
                });

            migrationBuilder.CreateTable(
                name: "Scenes",
                columns: table => new
                {
                    SceneID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ConnectionID = table.Column<int>(type: "INTEGER", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    MiniGameID = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Scenes", x => x.SceneID);
                    table.ForeignKey(
                        name: "FK_Scenes_MiniGames_MiniGameID",
                        column: x => x.MiniGameID,
                        principalTable: "MiniGames",
                        principalColumn: "MiniGameID");
                });

            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    PlayerID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserID = table.Column<int>(type: "INTEGER", nullable: false),
                    ItemID = table.Column<int>(type: "INTEGER", nullable: false),
                    Health = table.Column<int>(type: "INTEGER", nullable: false),
                    Force = table.Column<int>(type: "INTEGER", nullable: false),
                    ObiWanRelationship = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.PlayerID);
                    table.ForeignKey(
                        name: "FK_Players_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChoicesConnections",
                columns: table => new
                {
                    ChoicesConnectionsID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SceneFrom = table.Column<int>(type: "INTEGER", nullable: false),
                    SceneTo = table.Column<int>(type: "INTEGER", nullable: false),
                    Text = table.Column<string>(type: "TEXT", nullable: false),
                    Effect = table.Column<string>(type: "TEXT", nullable: false),
                    RequiredItemID = table.Column<int>(type: "INTEGER", nullable: true),
                    FromSceneSceneID = table.Column<int>(type: "INTEGER", nullable: true),
                    ToSceneSceneID = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChoicesConnections", x => x.ChoicesConnectionsID);
                    table.ForeignKey(
                        name: "FK_ChoicesConnections_Items_RequiredItemID",
                        column: x => x.RequiredItemID,
                        principalTable: "Items",
                        principalColumn: "ItemID");
                    table.ForeignKey(
                        name: "FK_ChoicesConnections_Scenes_FromSceneSceneID",
                        column: x => x.FromSceneSceneID,
                        principalTable: "Scenes",
                        principalColumn: "SceneID");
                    table.ForeignKey(
                        name: "FK_ChoicesConnections_Scenes_ToSceneSceneID",
                        column: x => x.ToSceneSceneID,
                        principalTable: "Scenes",
                        principalColumn: "SceneID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChoicesConnections_FromSceneSceneID",
                table: "ChoicesConnections",
                column: "FromSceneSceneID");

            migrationBuilder.CreateIndex(
                name: "IX_ChoicesConnections_RequiredItemID",
                table: "ChoicesConnections",
                column: "RequiredItemID");

            migrationBuilder.CreateIndex(
                name: "IX_ChoicesConnections_ToSceneSceneID",
                table: "ChoicesConnections",
                column: "ToSceneSceneID");

            migrationBuilder.CreateIndex(
                name: "IX_Players_UserID",
                table: "Players",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Scenes_MiniGameID",
                table: "Scenes",
                column: "MiniGameID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChoicesConnections");

            migrationBuilder.DropTable(
                name: "Players");

            migrationBuilder.DropTable(
                name: "Items");

            migrationBuilder.DropTable(
                name: "Scenes");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "MiniGames");
        }
    }
}
