using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace stinsily.Server.Models
{
    public class Scenes
    {
        [Key]
        public int SceneID { get; set; }
        public int ConnectionID { get; set; } //foreign key
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageURL { get; set; }

        // New field to associate an item with a scene
        public int? ItemID { get; set; }

        // Navigation properties
        public virtual Items? Item { get; set; }
    }
}
