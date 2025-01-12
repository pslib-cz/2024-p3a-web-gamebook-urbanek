namespace stinsily.Server.Models
{
    public class ChoicesConnections
    {
        public int ChoicesConnectionsID { get; set; }
        public int SceneFromID { get; set; }
        public int SceneToID { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Effect { get; set; } = string.Empty; // Format: "health:+10" or "force:-5" or "obiwan:+15" or "scene:5"
        public int? RequiredItemID { get; set; }
        public int? MiniGameID { get; set; }

        // Make navigation properties optional
        public virtual Scenes? SceneFrom { get; set; }
        public virtual Scenes? SceneTo { get; set; }
        public virtual Items? RequiredItem { get; set; }
        public virtual MiniGames? MiniGame { get; set; }
    }
}
