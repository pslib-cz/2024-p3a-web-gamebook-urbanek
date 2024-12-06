namespace stinsily.Server.Models
{
    public class Scenes
    {
        public int SceneID { get; set; }
        public int ConnectionID { get; set; } //foreign key
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int MinigameID { get; set; } //foreign key
    }
}
