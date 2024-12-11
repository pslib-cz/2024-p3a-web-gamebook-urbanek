using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using stinsily.Server.Models;

namespace stinsily.Server.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public new DbSet<Users> Users { get; set; }
        public DbSet<Player> Players { get; set; }
        public DbSet<Scenes> Scenes { get; set; }
        public DbSet<Items> Items { get; set; }
        public DbSet<ChoicesConnections> ChoicesConnections { get; set; }
        public DbSet<MiniGames> MiniGames { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Users>().ToTable("Users");
            modelBuilder.Entity<Player>().ToTable("Players");
            modelBuilder.Entity<Scenes>().ToTable("Scenes");
            modelBuilder.Entity<Items>().ToTable("Items");
            modelBuilder.Entity<ChoicesConnections>().ToTable("ChoicesConnections");
            modelBuilder.Entity<MiniGames>().ToTable("MiniGames");
            base.OnModelCreating(modelBuilder);

            // Seed admin user if it doesn't already exist
            var adminUserId = "admin-user-id";
            var adminEmail = "admin@admin.cz";
            var adminPassword = "admin";

            var hasher = new PasswordHasher<IdentityUser>();
            var adminUser = new IdentityUser
            {
                Id = adminUserId,
                UserName = adminEmail,
                NormalizedUserName = adminEmail.ToUpper(),
                Email = adminEmail,
                NormalizedEmail = adminEmail.ToUpper(),
                EmailConfirmed = true,
                SecurityStamp = Guid.NewGuid().ToString("D")
            };
            adminUser.PasswordHash = hasher.HashPassword(adminUser, adminPassword);

            modelBuilder.Entity<IdentityUser>().HasData(adminUser);

            modelBuilder.Entity<IdentityUserLogin<string>>().HasKey(login => new { login.LoginProvider, login.ProviderKey });
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
            optionsBuilder.ConfigureWarnings(warnings => warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
        }
    }
}