using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using stinsily.Server.Models;

namespace stinsily.Server.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public new DbSet<Users> Users { get; set; }
        public DbSet<Players> Players { get; set; }
        public DbSet<Scenes> Scenes { get; set; }
        public DbSet<Items> Items { get; set; }
        public DbSet<ChoicesConnections> ChoicesConnections { get; set; }
        public DbSet<MiniGames> MiniGames { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Users>().ToTable("Users");
            modelBuilder.Entity<Players>().ToTable("Players");
            modelBuilder.Entity<Scenes>().ToTable("Scenes");
            modelBuilder.Entity<Items>().ToTable("Items");
            modelBuilder.Entity<ChoicesConnections>().ToTable("ChoicesConnections");
            modelBuilder.Entity<MiniGames>().ToTable("MiniGames");
            base.OnModelCreating(modelBuilder);

            // Only seed game data
            modelBuilder.Entity<Scenes>().HasData(
                new Scenes { SceneID = 1, ConnectionID = 1, Title = "Scena1", Description = "trenink" },
                new Scenes { SceneID = 2, ConnectionID = 2, Title = "Scena2", Description = "rozhodnuti pristupu" },
                new Scenes { SceneID = 3, ConnectionID = 3, Title = "Scena3", Description = "podmineny postup" }
            );
            
            modelBuilder.Entity<Items>().HasData(
                new Items { ItemID = 1, Name = "nic", Description = "nic", HealthModifier = 0, ForceModifier = 0, ObiWanRelationshipModifier = 0 },
                new Items { ItemID = 2, Name = "Svetelny mec", Description = "mec", HealthModifier = 0, ForceModifier = 10, ObiWanRelationshipModifier = 0}
            );
            
            modelBuilder.Entity<ChoicesConnections>().HasData(
                new ChoicesConnections { 
                    ChoicesConnectionsID = 1, 
                    SceneFromID = 1, 
                    SceneToID = 2, 
                    Text = "prechod na 2. scenu", 
                    Effect = "pokracovani v pribehu", 
                    RequiredItemID = 1, 
                    MiniGameID = 1
                },
                new ChoicesConnections
                {
                    ChoicesConnectionsID = 2,
                    SceneFromID = 2,
                    SceneToID = 3,
                    Text = "Postup do další místnosti (potřebujete světelný meč)",
                    Effect = "podmínený postup",
                    RequiredItemID = 2,
                    MiniGameID = 1
                }
            );
            
            modelBuilder.Entity<MiniGames>().HasData(
                new MiniGames { MiniGameID = 1, Description = "nic" },
                new MiniGames { MiniGameID = 2, Description = "mini hra 1" }
            );

            modelBuilder.Entity<Players>()
                .HasOne(p => p.User)
                .WithOne(u => u.Player)
                .HasForeignKey<Players>(p => p.UserID);
        }

        public void UpdateAdminUser(string email, string password)
        {
            var adminUserId = "admin-user-id";
            var hasher = new PasswordHasher<IdentityUser>();
            var adminUser = this.Users.OfType<IdentityUser>().FirstOrDefault(u => u.Id == adminUserId);

            if (adminUser != null)
            {
                adminUser.UserName = email;
                adminUser.NormalizedUserName = email.ToUpper();
                adminUser.Email = email;
                adminUser.NormalizedEmail = email.ToUpper();
                adminUser.PasswordHash = hasher.HashPassword(adminUser, password);
                adminUser.SecurityStamp = Guid.NewGuid().ToString("D");

                this.Update(adminUser);
                this.SaveChanges();
            }
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=gamebook.db");
        }
    }
}