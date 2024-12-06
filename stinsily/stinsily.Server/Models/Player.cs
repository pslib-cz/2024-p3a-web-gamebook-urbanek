namespace stinsily.Server.Models
{
    public class Player
    {
        public int PlayerID { get; set; }
        public int UserID { get; set; } //foreign key
        public int ItemID { get; set; } //foreign key
        public int Health { get; set; }
        public int Force { get; set; }
        public int ObiWanRelationship { get; set; }
        public bool ItemIsUsed { get; set; }
    }
}
