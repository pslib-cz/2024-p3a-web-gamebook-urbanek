using Microsoft.AspNetCore.Identity;
using stinsily.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using System.IO;

namespace stinsily.Server.Data
{
    public class AppDbContext : IdentityDbContext<IdentityUser>
    {
        private readonly IConfiguration _configuration;

        public AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration) : base(options)
        {
            _configuration = configuration;
        }

        public new DbSet<Users> Users { get; set; }
        public DbSet<Players> Players { get; set; }
        public DbSet<Scenes> Scenes { get; set; }
        public DbSet<Items> Items { get; set; }
        public DbSet<ChoicesConnections> ChoicesConnections { get; set; }
        public DbSet<MiniGames> MiniGames { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                try
                {
                    // Try different paths for the database
                    var dataDirectory = Path.Combine(Directory.GetCurrentDirectory(), "data");
                    Console.WriteLine($"Attempting to create directory: {dataDirectory}");
                    
                    // Try to create directory with exception handling
                    try {
                        Directory.CreateDirectory(dataDirectory);
                        Console.WriteLine($"Directory created or already exists: {dataDirectory}");
                    } catch (Exception ex) {
                        Console.WriteLine($"Error creating directory: {ex.Message}");
                    }
                    
                    // List directory contents
                    Console.WriteLine($"Directory exists check: {Directory.Exists(dataDirectory)}");
                    if (Directory.Exists(dataDirectory)) {
                        Console.WriteLine("Directory contents:");
                        foreach (var file in Directory.GetFiles(dataDirectory)) {
                            Console.WriteLine($"  - {file}");
                        }
                    }
                    
                    var dbPath = Path.Combine(dataDirectory, "gamebook.db");
                    Console.WriteLine($"Database path: {dbPath}");

                    // Try to touch the file to make sure we can write there
                    try {
                        if (!File.Exists(dbPath)) {
                            File.WriteAllText(dbPath + ".test", "test");
                            Console.WriteLine("Successfully wrote test file");
                        }
                    } catch (Exception ex) {
                        Console.WriteLine($"Error testing file write: {ex.Message}");
                    }

                    optionsBuilder
                        .UseSqlite($"Data Source={dbPath}")
                        .EnableSensitiveDataLogging()
                        .LogTo(Console.WriteLine);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Critical error in OnConfiguring: {ex.Message}");
                    // Fallback to memory database as a last resort
                    optionsBuilder.UseInMemoryDatabase("FallbackDb");
                    Console.WriteLine("Using in-memory database as fallback");
                }
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Users>().ToTable("Users");
            modelBuilder.Entity<Players>().ToTable("Players");
            modelBuilder.Entity<Scenes>().ToTable("Scenes");
            modelBuilder.Entity<Items>().ToTable("Items");
            modelBuilder.Entity<ChoicesConnections>().ToTable("ChoicesConnections");
            modelBuilder.Entity<MiniGames>().ToTable("MiniGames");

            modelBuilder.Entity<Players>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserID);
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
    }
} 