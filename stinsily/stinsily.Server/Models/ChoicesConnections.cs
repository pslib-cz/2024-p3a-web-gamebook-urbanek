namespace stinsily.Server.Models
{
    public class ChoicesConnections
    {
        public int ChoicesConnectionsID { get; set; }
        public int SceneFrom { get; set; } //foreign key
        public int SceneTo { get; set; } //foreign key
        public string Text { get; set; } = string.Empty;
        public string Effect { get; set; } = string.Empty;
        public int RequiredItemID { get; set; } //foreign key
    }
}
