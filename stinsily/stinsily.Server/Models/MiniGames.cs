using System.ComponentModel.DataAnnotations;

namespace stinsily.Server.Models
{
    public class MiniGames
    {
        [Key]
        public int MiniGameID { get; set; }
        public string Description { get; set; } = string.Empty;
        public enum MiniGameType
        {
            Puzzle,
            Battle,
            Repair
        }
    }
}
