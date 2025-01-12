using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace stinsily.Server.Models
{
    public class Scenes
    {
        [Key]
        public int SceneID { get; set; }
        public int ConnectionID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageURL { get; set; }
        public int? ItemID { get; set; }

        // Navigation properties
        public virtual Items? Item { get; set; }
    }
}
