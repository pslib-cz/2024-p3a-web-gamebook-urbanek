namespace stinsily.Server.Models
{
    public class ChoicesConnections
    {
        public int ChoicesConnectionsID { get; set; }
        public int SceneFromID { get; set; }
        public int SceneToID { get; set; }
        public string? Text { get; set; }
        public string? Effect { get; set; }
        public int? RequiredItemID { get; set; }
        public int? MiniGameID { get; set; }

        // Navigation properties
        public virtual Scenes? FromScene { get; set; }
        public virtual Scenes? ToScene { get; set; }
        public virtual Items? RequiredItem { get; set; }
        public virtual MiniGames? MiniGame { get; set; }
    }
}
