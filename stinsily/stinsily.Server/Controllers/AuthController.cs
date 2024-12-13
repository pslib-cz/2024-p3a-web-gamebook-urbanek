using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace stinsily.Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly SignInManager<IdentityUser> _signInManager;

        public AuthController(SignInManager<IdentityUser> signInManager)
        {
            _signInManager = signInManager;
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

            if (!result.Succeeded)
            {
                return Unauthorized("Invalid credentials.");
            }

            return Ok("Login successful.");
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
    }

    public class CustomLoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}