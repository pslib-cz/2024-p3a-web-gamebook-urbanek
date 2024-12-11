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

        public DbSet<Users> Users { get; set; }
        public DbSet<Player> Players { get; set; }
        public DbSet<Scenes> Scenes { get; set; }
        public DbSet<Items> Items { get; set; }
        public DbSet<ChoicesConnections> ChoicesConnections { get; set; }
        public DbSet<MiniGames> MiniGames { get; set; }
        public DbSet<IdentityRole> IdentityRole { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Users>().ToTable("Users");
            modelBuilder.Entity<Player>().ToTable("Players");
            modelBuilder.Entity<Scenes>().ToTable("Scenes");
            modelBuilder.Entity<Items>().ToTable("Items");
            modelBuilder.Entity<ChoicesConnections>().ToTable("ChoicesConnections");
            modelBuilder.Entity<MiniGames>().ToTable("MiniGames");
            base.OnModelCreating(modelBuilder);
            //seed pro pridani prihlasovacich udaju do databaze se vsemi detaily, jen experimentalnim, upravit a checknout
            modelBuilder.Entity<IdentityUser>().HasData(
                new IdentityUser
                {
                    Id = adminUserId,
                    UserName = adminEmail,
                    NormalizedUserName = adminEmail.ToUpper(),
                    Email = admin@admin.cz,
                    NormalizedEmail = adminEmail.ToUpper(),
                    EmailConfirmed = true,
                    PasswordHash = adminPasswordHash,
                    SecurityStamp = Guid.NewGuid().ToString("D")
                }
            );
            modelBuilder.Entity<IdentityUserLogin<string>>().HasKey(login => new { login.LoginProvider, login.ProviderKey });
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlite("Data Source=gamebook.db");
        }
    }
}
