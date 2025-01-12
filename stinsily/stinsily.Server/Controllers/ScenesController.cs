using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;
using stinsily.Server.Models;
using Microsoft.Extensions.Logging;

namespace stinsily.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScenesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ScenesController> _logger;

        public ScenesController(AppDbContext context, UserManager<IdentityUser> userManager, IWebHostEnvironment environment, ILogger<ScenesController> logger)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
            _logger = logger;

            // Ensure uploads directory exists
            var uploadsPath = Path.Combine(_environment.WebRootPath, "Uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }
        }

        [HttpGet("check-admin")]
        public async Task<IActionResult> CheckAdmin()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            return Ok(new { isAdmin });
        }

        // GET: api/Scenes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Scenes>>> GetScenes()
        {
            return await _context.Scenes.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Scenes>> GetScene(int id)
        {
            var scene = await _context.Scenes.FindAsync(id);

            if (scene == null)
            {
                return NotFound();
            }

            // Make sure ImageURL is included in the response
            return new JsonResult(new {
                sceneID = scene.SceneID,
                title = scene.Title,
                description = scene.Description,
                imageURL = scene.ImageURL,  // Make sure this property exists and is being set
                connectionID = scene.ConnectionID,
                itemID = scene.ItemID
            });
        }

        [HttpGet("available-scenes")]
        public async Task<IActionResult> GetAvailableScenes()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                    return Unauthorized("User not authenticated");

                var player = await _context.Players
                    .Include(p => p.CurrentScene)
                    .Include(p => p.ItemID)
                    .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

                if (player == null)
                    return NotFound("Player not found");

                if (player.CurrentScene == null)
                    return NotFound("Current scene not found");

                var availableScenes = await _context.ChoicesConnections
                    .Where(cc => cc.SceneFromID == player.CurrentScene.SceneID)
                    .Where(cc => cc.RequiredItemID == null || 
                                player.ItemID == cc.RequiredItemID)
                    .Select(cc => new
                    {
                        SceneID = cc.SceneToID,
                        Text = cc.Text
                    })
                    .ToListAsync();

                return Ok(availableScenes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

 
        [HttpGet("options/{sceneId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSceneOptions(int sceneId)
        {
            try
            {
                var scene = await _context.Scenes.FindAsync(sceneId);
                if (scene == null) return NotFound();

                // Get all connections for this scene
                var connections = await _context.ChoicesConnections
                    .Where(c => c.SceneFromID == sceneId)
                    .Include(c => c.RequiredItem)
                    .ToListAsync();

                var options = connections.Select(connection => new
                {
                    optionId = connection.ChoicesConnectionsID,
                    text = connection.Text,
                    nextSceneId = connection.SceneToID,
                    effect = connection.Effect,
                    type = "navigation"
                }).ToList();

                return Ok(options);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        public class ItemActionRequest
        {
            public string Action { get; set; } = string.Empty;
            public int ItemId { get; set; }
        }

        [HttpPost("item")]
        public async Task<ActionResult<IEnumerable<object>>> HandleItem([FromBody] ItemActionRequest request)
        {
            try
            {
                var player = await _context.Players.FirstOrDefaultAsync();
                
                if (player == null)
                {
                    var defaultScene = await _context.Scenes.FirstOrDefaultAsync();
                    if (defaultScene == null)
                    {
                        return StatusCode(500, "No scenes found in database");
                    }

                    player = new Players 
                    { 
                        UserID = 1,
                        CurrentSceneID = defaultScene.SceneID,
                        ItemID = null,
                        Health = 100,
                        Force = 100,
                        ObiWanRelationship = 50
                    };

                    _context.Players.Add(player);
                    await _context.SaveChangesAsync();
                }

                // Handle item action
                if (request.Action.ToLower() == "pickup")
                {
                    var item = await _context.Items.FindAsync(request.ItemId);
                    if (item == null)
                    {
                        return NotFound($"Item {request.ItemId} not found");
                    }
                    player.ItemID = item.ItemID;
                }
                else if (request.Action.ToLower() == "drop")
                {
                    player.ItemID = null;
                }

                await _context.SaveChangesAsync();
                return await GetSceneOptions(player.CurrentSceneID);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in HandleItem: {ex.Message}");
                return StatusCode(500, "Error handling item");
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutScenes(int id, [FromForm] SceneCreateRequest request)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null || user.Email != "admin@admin.com")
                {
                    return Unauthorized();
                }

                var scene = await _context.Scenes.FindAsync(id);
                if (scene == null)
                {
                    return NotFound($"Scene with ID {id} not found");
                }

                // Update basic properties
                scene.SceneID = request.SceneID;
                scene.ConnectionID = request.ConnectionID;
                scene.Title = request.Title;
                scene.Description = request.Description;
                scene.ItemID = request.ItemID;

                // Handle image update if provided
                if (request.Image != null && request.Image.Length > 0)
                {
                    // Delete old image if it exists
                    if (!string.IsNullOrEmpty(scene.ImageURL))
                    {
                        var oldImagePath = Path.Combine(_environment.WebRootPath, scene.ImageURL.TrimStart('/'));
                        if (System.IO.File.Exists(oldImagePath))
                        {
                            System.IO.File.Delete(oldImagePath);
                        }
                    }

                    // Save new image
                    var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
                    Directory.CreateDirectory(uploadsPath);

                    var fileName = $"scene_{scene.SceneID}_{Guid.NewGuid()}.jpg";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    using (var fileStream = System.IO.File.Create(filePath))
                    {
                        await request.Image.CopyToAsync(fileStream);
                    }

                    scene.ImageURL = $"/uploads/{fileName}";
                }

                _context.Update(scene);
                await _context.SaveChangesAsync();

                return Ok(scene);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating scene: {ex.Message}");
                return StatusCode(500, "Error updating scene");
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> AddScene([FromForm] SceneCreateRequest request)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null || user.Email != "admin@admin.com")
                {
                    return Unauthorized();
                }

                _logger.LogInformation("Starting scene creation process");

                var scene = new Scenes
                {
                    SceneID = request.SceneID,
                    ConnectionID = request.ConnectionID,
                    Title = request.Title,
                    Description = request.Description,
                    ItemID = request.ItemID,
                    ImageURL = string.Empty,
                };

                if (request.Image != null && request.Image.Length > 0)
                {
                    _logger.LogInformation($"Processing image: {request.Image.FileName}, Size: {request.Image.Length} bytes");

                    try
                    {
                        // Use wwwroot/uploads for file storage
                        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                        if (!Directory.Exists(uploadsFolder))
                        {
                            Directory.CreateDirectory(uploadsFolder);
                            _logger.LogInformation($"Created uploads directory: {uploadsFolder}");
                        }

                        var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(request.Image.FileName)}";
                        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
                        _logger.LogInformation($"Saving file to: {filePath}");

                        using (var fileStream = new FileStream(filePath, FileMode.Create))
                        {
                            await request.Image.CopyToAsync(fileStream);
                        }

                        scene.ImageURL = $"/uploads/{uniqueFileName}";
                        _logger.LogInformation($"File saved successfully. URL: {scene.ImageURL}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error saving file: {ex.Message}");
                        _logger.LogError($"Stack trace: {ex.StackTrace}");
                        return StatusCode(500, $"Error saving image: {ex.Message}");
                    }
                }

                try
                {
                    _context.Scenes.Add(scene);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Scene saved to database. ID: {scene.SceneID}");
                    return Ok(scene);
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Database error: {ex.Message}");
                    return StatusCode(500, $"Error saving scene to database: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating scene: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("move-to-scene")]
        public async Task<IActionResult> MoveToScene([FromBody] int nextSceneId)
        {
            var user = await _userManager.GetUserAsync(User);
            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .Include(p => p.ItemID)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

            if (player == null)
                return NotFound("Player not found");

            var nextScene = await _context.Scenes.FindAsync(nextSceneId);
            if (nextScene == null)
                return NotFound("Scene not found");

            player.CurrentScene = nextScene;
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteScenes(int id)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null || user.Email != "admin@admin.com")
            {
                return Unauthorized();
            }

            var scenes = await _context.Scenes.FindAsync(id);
            if (scenes == null)
            {
                return NotFound();
            }

            _context.Scenes.Remove(scenes);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool ScenesExists(int id)
        {
            return _context.Scenes.Any(e => e.SceneID == id);
        }

        [HttpPost("save-progress")]
        public async Task<IActionResult> SaveProgress([FromBody] SaveProgressRequest request)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var player = await _context.Players
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

            if (player == null)
            {
                player = new Players { UserID = int.Parse(user.Id) };
                _context.Players.Add(player);
            }

            var scene = await _context.Scenes.FindAsync(request.LastSceneId);
            if (scene != null)
            {
                player.CurrentScene = scene;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("last-scene")]
        public async Task<IActionResult> GetLastScene()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

            return Ok(new { lastSceneId = player?.CurrentScene?.SceneID ?? 1 });
        }

        public class SaveProgressRequest
        {
            public int LastSceneId { get; set; }
        }

        [HttpGet("current-user")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Unauthorized();
            }
            
            return Ok(new { email = user.Email });
        }

        [HttpPut("{id}/image")]
        [Authorize]
        public async Task<IActionResult> UpdateSceneImage(int id, [FromForm] IFormFile image)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null || user.Email != "admin@admin.com")
                {
                    return Unauthorized();
                }

                var scene = await _context.Scenes.FindAsync(id);
                if (scene == null)
                {
                    return NotFound($"Scene with ID {id} not found");
                }

                if (image != null && image.Length > 0)
                {
                    // Delete old image if it exists
                    if (!string.IsNullOrEmpty(scene.ImageURL))
                    {
                        var oldImagePath = Path.Combine(_environment.WebRootPath, scene.ImageURL.TrimStart('/'));
                        if (System.IO.File.Exists(oldImagePath))
                        {
                            System.IO.File.Delete(oldImagePath);
                        }
                    }

                    // Save new image
                    var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
                    Directory.CreateDirectory(uploadsPath);

                    var fileName = $"scene_{scene.SceneID}_{Guid.NewGuid()}.jpg";
                    var filePath = Path.Combine(uploadsPath, fileName);

                    using (var fileStream = System.IO.File.Create(filePath))
                    {
                        await image.CopyToAsync(fileStream);
                    }

                    scene.ImageURL = $"/uploads/{fileName}";
                    _context.Update(scene);
                    await _context.SaveChangesAsync();
                }

                return Ok(scene);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating scene image: {ex.Message}");
                return StatusCode(500, "Error updating scene image");
            }
        }

        [HttpPost("apply-effect")]
        public async Task<ActionResult> ApplyEffect([FromBody] EffectRequest request)
        {
            try
            {
                var player = await _context.Players.FirstOrDefaultAsync();
                if (player == null) return NotFound("Player not found");

                var effectParts = request.Effect.Split(':');
                if (effectParts.Length != 2) return BadRequest("Invalid effect format");

                var effectType = effectParts[0];
                var effectValue = int.Parse(effectParts[1]);

                switch (effectType)
                {
                    case "health":
                        player.Health = Math.Clamp(player.Health + effectValue, 0, 100);
                        break;
                    case "force":
                        player.Force = Math.Clamp(player.Force + effectValue, 0, 100);
                        break;
                    case "obiwan":
                        player.ObiWanRelationship = Math.Clamp(player.ObiWanRelationship + effectValue, 0, 100);
                        break;
                    case "scene":
                        // Scene navigation is handled client-side
                        break;
                    default:
                        return BadRequest("Unknown effect type");
                }

                await _context.SaveChangesAsync();
                return Ok(new { 
                    health = player.Health,
                    force = player.Force,
                    obiWanRelationship = player.ObiWanRelationship
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        public class EffectRequest
        {
            public string Effect { get; set; } = string.Empty;
        }
    }

    public class SceneCreateRequest
    {
        public int SceneID { get; set; }
        public int ConnectionID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public IFormFile? Image { get; set; }
        public int? ItemID { get; set; }
    }
}