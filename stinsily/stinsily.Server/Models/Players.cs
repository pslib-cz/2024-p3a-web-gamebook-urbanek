using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace stinsily.Server.Models
{
    public class Players
    {
        [Key]
        public int PlayerID { get; set; }
        public int UserID { get; set; }
        public int CurrentSceneID { get; set; }
        public int ItemID { get; set; }
        public int Health { get; set; }
        public int Force { get; set; }
        public int ObiWanRelationship { get; set; }

        public virtual Users User { get; set; } = null!;
        public virtual Scenes? CurrentScene { get; set; }
    }
}
