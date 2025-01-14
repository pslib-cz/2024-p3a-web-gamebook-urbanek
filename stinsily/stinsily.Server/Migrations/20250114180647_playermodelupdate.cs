using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace stinsily.Server.Migrations
{
    /// <inheritdoc />
    public partial class playermodelupdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_Users_UserID",
                table: "Players");

            migrationBuilder.DropIndex(
                name: "IX_Players_UserID",
                table: "Players");

            migrationBuilder.AddColumn<int>(
                name: "PlayerID",
                table: "Users",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_PlayerID",
                table: "Users",
                column: "PlayerID");

            migrationBuilder.CreateIndex(
                name: "IX_Players_UserID",
                table: "Players",
                column: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Players_AspNetUsers_UserID",
                table: "Players",
                column: "UserID",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Players_PlayerID",
                table: "Users",
                column: "PlayerID",
                principalTable: "Players",
                principalColumn: "PlayerID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Players_AspNetUsers_UserID",
                table: "Players");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Players_PlayerID",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_PlayerID",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Players_UserID",
                table: "Players");

            migrationBuilder.DropColumn(
                name: "PlayerID",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_Players_UserID",
                table: "Players",
                column: "UserID",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Players_Users_UserID",
                table: "Players",
                column: "UserID",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
