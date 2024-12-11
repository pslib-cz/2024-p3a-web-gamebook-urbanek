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
    }
}
