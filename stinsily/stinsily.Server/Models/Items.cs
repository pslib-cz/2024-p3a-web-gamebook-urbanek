namespace stinsily.Server.Models
{
    public class Items
    {
        public int ItemID { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Health { get; set; }
        public int Force { get; set; }
        public int ObiWanRelationshipModifier { get; set; }
    }
}
