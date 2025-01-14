using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace stinsily.Server.Models
{
    public class Players
    {
        [Key]
        public int PlayerID { get; set; }
        
        [Required]
        public string UserID { get; set; } = string.Empty;
        
        public int CurrentSceneID { get; set; }
        public int? ItemID { get; set; }
        public int Health { get; set; }
        public int Force { get; set; }
        public int ObiWanRelationship { get; set; }

        [ForeignKey("UserID")]
        public virtual IdentityUser User { get; set; } = null!;
        
        [ForeignKey("CurrentSceneID")]
        public virtual Scenes? CurrentScene { get; set; }
    }
}
