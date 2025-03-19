using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;
using stinsily.Server.Models;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

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

            var uploadsPath = Path.Combine(_environment.WebRootPath, "Uploads");
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Scenes>>> GetScenes()
        {
            return await _context.Scenes.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Scenes>> GetScene(int id)
        {
            try
            {
                _logger.LogInformation($"Attempting to get scene with ID: {id}");
                
                // First check if we can connect to the database
                var dbPath = _context.Database.GetDbConnection().ConnectionString;
                _logger.LogInformation($"Database connection string: {dbPath}");
                
                // Try to get all scenes first to see if we can read from the database
                var allScenes = await _context.Scenes.ToListAsync();
                _logger.LogInformation($"Total scenes in database: {allScenes.Count}");
                
                var scene = await _context.Scenes.FindAsync(id);

                if (scene == null)
                {
                    _logger.LogWarning($"Scene with ID {id} not found");
                    return NotFound($"Scene with ID {id} not found");
                }

                _logger.LogInformation($"Successfully retrieved scene: {scene.Title}");
                
                return new JsonResult(new {
                    sceneID = scene.SceneID,
                    title = scene.Title,
                    description = scene.Description,
                    imageURL = scene.ImageURL,
                    connectionID = scene.ConnectionID,
                    itemID = scene.ItemID
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting scene {id}: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Error retrieving scene: {ex.Message}");
            }
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
                    .FirstOrDefaultAsync(p => p.UserID == user.Id);

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
                    requiredItemID = connection.RequiredItemID,
                    miniGameID = connection.MiniGameID
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
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    return Unauthorized("User not authenticated");
                }

                var player = await _context.Players.FirstOrDefaultAsync(p => p.UserID == user.Id);
                
                if (player == null)
                {
                    var defaultScene = await _context.Scenes.FirstOrDefaultAsync();
                    if (defaultScene == null)
                    {
                        return StatusCode(500, "No scenes found in database");
                    }

                    player = new Players 
                    { 
                        UserID = user.Id,
                        CurrentSceneID = defaultScene.SceneID,
                        ItemID = null,
                        Health = 100,
                        Force = 100,
                        ObiWanRelationship = 50
                    };

                    _context.Players.Add(player);
                    await _context.SaveChangesAsync();
                }

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

                scene.SceneID = request.SceneID;
                scene.ConnectionID = request.ConnectionID;
                scene.Title = request.Title;
                scene.Description = request.Description;
                scene.ItemID = request.ItemID;

                // if (request.Image != null && request.Image.Length > 0)
                // {
                //     if (!string.IsNullOrEmpty(scene.ImageURL))
                //     {
                //         var oldImagePath = Path.Combine(_environment.WebRootPath, scene.ImageURL.TrimStart('/'));
                //         if (System.IO.File.Exists(oldImagePath))
                //         {
                //             System.IO.File.Delete(oldImagePath);
                //         }
                //     }

                //     var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads");
                //     Directory.CreateDirectory(uploadsPath);

                //     var fileName = $"scene_{scene.SceneID}_{Guid.NewGuid()}.jpg";
                //     var filePath = Path.Combine(uploadsPath, fileName);

                //     using (var fileStream = System.IO.File.Create(filePath))
                //     {
                //         await request.Image.CopyToAsync(fileStream);
                //     }

                //     scene.ImageURL = $"/uploads/{fileName}";
                // }

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
                .FirstOrDefaultAsync(p => p.UserID == user.Id);

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

        [HttpPost("save-progress")]
        public async Task<IActionResult> SaveProgress([FromBody] SaveProgressRequest request)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null) return Unauthorized("User not authenticated");

                var player = await _context.Players.FirstOrDefaultAsync(p => p.UserID == user.Id);
                if (player == null)
                {
                    player = new Players
                    {
                        UserID = user.Id,
                        CurrentSceneID = request.SceneId,
                        Health = request.Stats.Health,
                        Force = request.Stats.Force,
                        ObiWanRelationship = request.Stats.ObiWanRelationship,
                        ItemID = null
                    };
                    _context.Players.Add(player);
                }
                else
                {
                    player.CurrentSceneID = request.SceneId;
                    player.Health = request.Stats.Health;
                    player.Force = request.Stats.Force;
                    player.ObiWanRelationship = request.Stats.ObiWanRelationship;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Progress saved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error saving progress: {ex.Message}");
                return StatusCode(500, "Error saving progress");
            }
        }

        public class SaveProgressRequest
        {
            public int SceneId { get; set; }
            public PlayerStatsRequest Stats { get; set; }
        }

        public class PlayerStatsRequest
        {
            public int Health { get; set; }
            public int Force { get; set; }
            public int ObiWanRelationship { get; set; }
        }

        [HttpGet("last-scene")]
        public async Task<IActionResult> GetLastScene()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
                return Unauthorized();

            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .FirstOrDefaultAsync(p => p.UserID == user.Id);

            return Ok(new { lastSceneId = player?.CurrentScene?.SceneID ?? 1 });
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
        public async Task<IActionResult> ApplyEffect([FromBody] EffectRequest request)
        {
            try
            {
                var userEmail = User.Identity?.Name;
                if (string.IsNullOrEmpty(userEmail))
                {
                    return BadRequest("User not authenticated");
                }

                var user = await _userManager.FindByNameAsync(userEmail);
                if (user == null) return NotFound("User not found");

                var player = await _context.Players.FirstOrDefaultAsync(p => p.UserID == user.Id);
                if (player == null)
                {
                    return NotFound("Player not found");
                }

                // Log the received effect
                _logger.LogInformation($"Received effect: {request.Effect}");

                // Parse and apply the effect
                var parts = request.Effect.Split(new[] { '+', '-' }, 2, StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length != 2)
                {
                    _logger.LogWarning($"Invalid effect format: {request.Effect}");
                    return BadRequest($"Invalid effect format. Expected format: stat+value or stat-value. Received: {request.Effect}");
                }

                var stat = parts[0].Trim().ToLower();
                var isAddition = request.Effect.Contains('+');
                if (!int.TryParse(parts[1], out int value))
                {
                    return BadRequest($"Invalid effect value: {parts[1]}");
                }

                // Apply the effect based on the stat
                switch (stat)
                {
                    case "health":
                        player.Health += isAddition ? value : -value;
                        break;
                    case "force":
                        player.Force += isAddition ? value : -value;
                        break;
                    case "obiwan":
                        player.ObiWanRelationship += isAddition ? value : -value;
                        break;
                    default:
                        return BadRequest($"Unknown stat: {stat}. Valid stats are: health, force, obiwan");
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Effect applied successfully", player });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ApplyEffect: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("player-stats")]
        public async Task<IActionResult> GetPlayerStats()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null)
                {
                    _logger.LogWarning("User not found");
                    return Unauthorized("User not authenticated");
                }

                _logger.LogInformation($"Getting stats for user ID: {user.Id}");

                var player = await _context.Players
                    .FirstOrDefaultAsync(p => p.UserID == user.Id);

                if (player == null)
                {
                    _logger.LogInformation("Creating new player");

                    // First check if Scene 1 exists, if not get the first available scene
                    var scene = await _context.Scenes.FindAsync(1) ?? 
                              await _context.Scenes.OrderBy(s => s.SceneID).FirstOrDefaultAsync();

                    if (scene == null)
                    {
                        _logger.LogError("No scenes found in the database");
                        return StatusCode(500, "No scenes available");
                    }

                    _logger.LogInformation($"Using scene {scene.SceneID} for new player");

                    player = new Players
                    {
                        UserID = user.Id,
                        Health = 100,
                        Force = 50,
                        ObiWanRelationship = 25,
                        ItemID = null,
                        CurrentSceneID = scene.SceneID
                    };

                    try
                    {
                        _context.Players.Add(player);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Successfully created new player with scene {scene.SceneID}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Failed to create player: {ex.Message}");
                        return StatusCode(500, $"Failed to create player: {ex.Message}");
                    }
                }

                // Get item name separately if needed
                var items = new List<string>();
                if (player.ItemID.HasValue)
                {
                    var item = await _context.Items.FindAsync(player.ItemID.Value);
                    if (item != null)
                    {
                        items.Add(item.Name);
                    }
                }

                return Ok(new
                {
                    health = player.Health,
                    force = player.Force,
                    obiWanRelationship = player.ObiWanRelationship,
                    item = items
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPlayerStats: {ex.Message}\nStack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("reset-stats")]
        public async Task<IActionResult> ResetStats()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null) return Unauthorized("User not authenticated");

                var player = await _context.Players.FirstOrDefaultAsync(p => p.UserID == user.Id);
                if (player != null)
                {
                    // Reset stats to default values
                    player.Health = 100;
                    player.Force = 50;
                    player.ObiWanRelationship = 25;
                    player.ItemID = null;
                    player.CurrentSceneID = 1;

                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Stats reset successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ResetStats: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("sync-stats")]
        public async Task<IActionResult> SyncStats([FromBody] PlayerStatsRequest stats)
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                if (user == null) return Unauthorized("User not authenticated");

                var player = await _context.Players.FirstOrDefaultAsync(p => p.UserID == user.Id);
                if (player != null)
                {
                    // Sync stats with what's in localStorage
                    player.Health = stats.Health;
                    player.Force = stats.Force;
                    player.ObiWanRelationship = stats.ObiWanRelationship;

                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Stats synced successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SyncStats: {ex.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
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

    public class EffectRequest
    {
        public string Effect { get; set; }
    }
}