using Microsoft.EntityFrameworkCore.Migrations;

public partial class AddEffectToChoicesConnections : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Add new Effect column with default value
        migrationBuilder.AddColumn<string>(
            name: "Effect",
            table: "ChoicesConnections",
            type: "TEXT",
            nullable: false,
            defaultValue: "");

        // Update Text column to be non-nullable with default value
        migrationBuilder.AlterColumn<string>(
            name: "Text",
            table: "ChoicesConnections",
            type: "TEXT",
            nullable: false,
            defaultValue: "",
            oldClrType: typeof(string),
            oldType: "TEXT",
            oldNullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Effect",
            table: "ChoicesConnections");

        migrationBuilder.AlterColumn<string>(
            name: "Text",
            table: "ChoicesConnections",
            type: "TEXT",
            nullable: true,
            oldClrType: typeof(string),
            oldType: "TEXT");
    }
} 