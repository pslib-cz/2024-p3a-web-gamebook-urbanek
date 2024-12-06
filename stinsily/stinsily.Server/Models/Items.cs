using System.ComponentModel.DataAnnotations;

namespace stinsily.Server.Models
{
    public class Items
    {
        [Key]
        public int ItemID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int HealthModifier { get; set; } = 0;
        public int ForceModifier { get; set; } = 0;
        public int ObiWanRelationshipModifier { get; set; } = 0;
    }
}
