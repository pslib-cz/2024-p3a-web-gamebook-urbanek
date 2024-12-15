using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using stinsily.Server.Data;
using stinsily.Server.Models;
using System.Linq;

namespace stinsily.Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly AppDbContext _context;

        public AuthController(
            SignInManager<IdentityUser> signInManager,
            UserManager<IdentityUser> userManager,
            RoleManager<IdentityRole> roleManager,
            AppDbContext context)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpGet("is-admin")]
        public IActionResult IsAdmin()
        {
            if (!User.Identity?.IsAuthenticated ?? true)
            {
                return Unauthorized("User is not authenticated");
            }

            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin)
            {
                return Unauthorized("User is not an admin");
            }
            return Ok(true); 
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] CustomLoginRequest request)
        {
            var result = await _signInManager.PasswordSignInAsync(
                request.Email,
                request.Password,
                isPersistent: false,
                lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var user = await _userManager.FindByEmailAsync(request.Email);
                // Generate simple token for now
                var token = Guid.NewGuid().ToString();
                
                return Ok(new { token = token, message = "Login successful" });
            }

            return Unauthorized("Invalid credentials");
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok("Logged out.");
        }

        [HttpGet("health")]
        public IActionResult Health()
        {
            return Ok("Server is running");
        }

        [HttpPost("seed-users")]
        public async Task<IActionResult> SeedUsers()
        {
            try
            {
                Console.WriteLine("Starting user seeding...");

                // Check if identity users exist
                var existingUser = await _userManager.FindByEmailAsync("user@user.cz");
                if (existingUser != null)
                {
                    Console.WriteLine("Users already exist in database");
                    return Ok("Users already exist in database");
                }

                // Clear existing Users and Players if any
                _context.Players.RemoveRange(_context.Players);
                _context.Users.RemoveRange(_context.Users);
                await _context.SaveChangesAsync();

                // Create Users record
                var basicUser = new Users
                {
                    Email = "user@user.cz",
                    UserName = "user",
                    Password = "userPassword123", // Longer password
                    IsAdmin = false
                };

                try
                {
                    Console.WriteLine("Adding basic user to context...");
                    _context.Users.Add(basicUser);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Basic user created with ID: {basicUser.UserID}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error creating basic user: {ex.Message}");
                    return BadRequest($"Error creating basic user: {ex.Message}");
                }

                // Create Player
                try
                {
                    Console.WriteLine("Creating player...");
                    var player = new Players
                    {
                        UserID = basicUser.UserID,
                        CurrentSceneID = 1,
                        ItemID = 1,
                        Health = 100,
                        Force = 25,
                        ObiWanRelationship = 50
                    };
                    _context.Players.Add(player);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("Player created successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error creating player: {ex.Message}");
                    return BadRequest($"Error creating player: {ex.Message}");
                }

                // Create IdentityUser with longer password
                try
                {
                    Console.WriteLine("Creating identity user...");
                    var identityUser = new IdentityUser
                    {
                UserName = "user@user.cz",
                Email = "user@user.cz",
                EmailConfirmed = true
                    };
                    var result = await _userManager.CreateAsync(identityUser, "userPassword123"); // Same longer password
                    if (!result.Succeeded)
                    {
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        Console.WriteLine($"Failed to create identity user: {errors}");
                        return BadRequest($"Failed to create identity user: {errors}");
                    }
                    Console.WriteLine("Identity user created successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error creating identity user: {ex.Message}");
                    return BadRequest($"Error creating identity user: {ex.Message}");
                }

                // Create admin with longer password
                try
                {
                    Console.WriteLine("Creating admin user...");
                    var adminIdentityUser = new IdentityUser
                    {
                        UserName = "admin@admin.cz",
                        Email = "admin@admin.cz",
                        EmailConfirmed = true
                    };
                    var result = await _userManager.CreateAsync(adminIdentityUser, "adminPassword123");
                    if (result.Succeeded)
                    {
                        if (!await _roleManager.RoleExistsAsync("Admin"))
                            {
                            await _roleManager.CreateAsync(new IdentityRole("Admin"));
                        }
                        await _userManager.AddToRoleAsync(adminIdentityUser, "Admin");
                        Console.WriteLine("Admin user created successfully");
                    }
                    else
                    {
                        var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                        Console.WriteLine($"Failed to create admin user: {errors}");
                        return BadRequest($"Failed to create admin user: {errors}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error creating admin user: {ex.Message}");
                    return BadRequest($"Error creating admin user: {ex.Message}");
                }

                Console.WriteLine("User seeding completed successfully");
                return Ok("Users seeded successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unexpected error during seeding: {ex.Message}");
                return BadRequest($"Unexpected error during seeding: {ex.Message}");
            }
        }
    }

    public class CustomLoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}