using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace stinsily.Server.Models
{
    public class Users
    {
        [Key]
        public int UserID { get; set; }
        public int PlayerID { get; set; } //foreign key
        [ForeignKey(nameof(PlayerID))]
        public Players? Player { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool IsAdmin { get; set; } = false;
    }
}
