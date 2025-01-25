using System.ComponentModel.DataAnnotations;

namespace stinsily.Server.Models
{
    public class MiniGames
    {
        [Key]
        public int MiniGameID { get; set; }
        public string Type { get; set; } = "SpaceJetRepair"; // For future expansion
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Difficulty { get; set; } // 1-3, affects time limit and components
        public int TimeLimit { get; set; } // in seconds
        public bool IsActive { get; set; } = true;
    }
}
