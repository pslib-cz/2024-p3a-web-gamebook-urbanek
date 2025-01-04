using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;
using stinsily.Server.Models;

namespace stinsily.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ScenesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;

        public ScenesController(AppDbContext context, UserManager<IdentityUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet("check-admin")]
        [Authorize]
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
        public async Task<ActionResult<object>> GetScene(int id)
        {
            try
            {
                Console.WriteLine($"Getting scene {id}");
                var scene = await _context.Scenes
                    .FirstOrDefaultAsync(s => s.SceneID == id);

                if (scene == null)
                {
                    Console.WriteLine($"Scene {id} not found");
                    return NotFound($"Scene {id} not found");
                }

                Console.WriteLine($"Found scene: {scene.Title}");
                return Ok(new
                {
                    id = scene.SceneID,
                    title = scene.Title,
                    description = scene.Description
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting scene: {ex.Message}");
                return StatusCode(500, "Error fetching scene");
            }
        }

        [Authorize]
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

 
        [HttpGet("options/{id}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSceneOptions(int id)
        {
            try
            {
                var options = new List<object>();
                var player = await _context.Players.FirstOrDefaultAsync();
                var currentItemId = player?.ItemID ?? 1;

                Console.WriteLine($"Current scene: {id}, Player item: {currentItemId}");

                // Add "Previous Scene" button if not on first scene
                if (id > 1)
                {
                    options.Add(new
                    {
                        optionId = -1,
                        text = "Previous Scene",
                        nextSceneId = id - 1,
                        type = "navigation"
                    });
                }

                // For scene 1, add the connection to scene 2
                if (id == 1)
                {
                    options.Add(new
                    {
                        optionId = 1,
                        text = "Next Scene",
                        nextSceneId = 2,
                        type = "navigation"
                    });
                }

                // For scene 2, handle item and conditional navigation
                if (id == 2)
                {
                    var hasLightsaber = currentItemId == 2;
                    
                    // Add item pickup/drop button
                    options.Add(new
                    {
                        optionId = -2,
                        text = hasLightsaber ? "Drop Lightsaber" : "Pick up Lightsaber",
                        type = "item",
                        itemId = 2,
                        action = hasLightsaber ? "drop" : "pickup"
                    });

                    // Show scene 3 button only if player has lightsaber
                    if (hasLightsaber)
                    {
                        options.Add(new
                        {
                            optionId = 2,
                            text = "Next Scene",
                            nextSceneId = 3,
                            type = "navigation"
                        });
                    }
                }

                // For scene 3, add navigation options without item requirements
                if (id == 3)
                {
                    options.Add(new
                    {
                        optionId = 3,
                        text = "Next Scene",
                        nextSceneId = 4,
                        type = "navigation"
                    });
                }

                Console.WriteLine($"Returning {options.Count} options with player having item {currentItemId}");
                return Ok(options);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetSceneOptions: {ex.Message}");
                return StatusCode(500, "Error fetching scene options");
            }
        }

        public class ItemActionRequest
        {
            public string Action { get; set; }
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
                    player = new Players { UserID = 1 };
                    _context.Players.Add(player);
                }

                if (request.Action.ToLower() == "pickup")
                {
                    player.ItemID = request.ItemId;
                }
                else if (request.Action.ToLower() == "drop")
                {
                    player.ItemID = 1; // Reset to default item (nothing)
                }

                await _context.SaveChangesAsync();

                // Immediately return new options after item action
                return await GetSceneOptions(2); // Hardcoded to scene 2 since that's where items are handled
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error handling item: {ex.Message}");
                return StatusCode(500, "Error handling item");
            }
        }

        // PUT: api/Scenes/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutScenes(int id, Scenes scenes)
        {
            if (id != scenes.SceneID)
            {
                return BadRequest();
            }

            _context.Entry(scenes).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ScenesExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Scenes
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Scenes>> PostScenes(Scenes scenes)
        {
            _context.Scenes.Add(scenes);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetScenes", new { id = scenes.SceneID }, scenes);
        }

        [Authorize]
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

        // DELETE: api/Scenes/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteScenes(int id)
        {
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
        [Authorize]
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
        [Authorize]
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
    }
}