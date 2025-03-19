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
                string dbPath;
                var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
                
                if (environment == "Production")
                {
                    // In production, use the root /data directory
                    dbPath = "../data/gamebook.db";
                }
                else
                {
                    // In development, search for the data directory
                    var projectRoot = Directory.GetCurrentDirectory();
                    while (!Directory.Exists(Path.Combine(projectRoot, "data")) && Directory.GetParent(projectRoot) != null)
                    {
                        projectRoot = Directory.GetParent(projectRoot).FullName;
                    }
                    dbPath = Path.Combine(projectRoot, "data", "gamebook.db");
                }

                Console.WriteLine($"Environment: {environment ?? "Development"}");
                Console.WriteLine($"Database path: {dbPath}");
                Console.WriteLine($"Directory exists: {Directory.Exists(Path.GetDirectoryName(dbPath))}");
                Console.WriteLine($"File exists: {File.Exists(dbPath)}");

                optionsBuilder
                    .UseSqlite(
                        $"Data Source={dbPath};Foreign Keys=True;",
                        options => {
                            options.CommandTimeout(60);
                            options.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                        })
                    .EnableSensitiveDataLogging()
                    .EnableDetailedErrors()
                    .LogTo(Console.WriteLine);

                // Try to open the database to verify connection
                try
                {
                    using var connection = new Microsoft.Data.Sqlite.SqliteConnection($"Data Source={dbPath}");
                    connection.Open();
                    
                    // Enable foreign keys
                    using var command = connection.CreateCommand();
                    command.CommandText = "PRAGMA foreign_keys = ON;";
                    command.ExecuteNonQuery();
                    
                    Console.WriteLine("Successfully connected to database and enabled foreign keys");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error connecting to database: {ex.Message}");
                    throw;
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