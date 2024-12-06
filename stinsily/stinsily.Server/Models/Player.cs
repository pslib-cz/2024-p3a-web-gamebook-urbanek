using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace stinsily.Server.Models
{
    public class Player
    {
        [Key]
        public int PlayerID { get; set; }
        public int UserID { get; set; } //foreign key
        [ForeignKey(nameof(UserID))]
        public Users User { get; set; }
        public int ItemID { get; set; } //foreign key
        public int Health { get; set; } = 100;
        public int Force { get; set; } = 25;
        public int ObiWanRelationship { get; set; } = 50;
    }
}
