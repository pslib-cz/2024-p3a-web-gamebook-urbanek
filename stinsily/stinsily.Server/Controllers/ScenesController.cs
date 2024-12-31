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

        // GET: api/Scenes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Scenes>>> GetScenes()
        {
            return await _context.Scenes.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Scenes>> GetScenes(int id)
        {
            var scenes = await _context.Scenes.FindAsync(id);

            if (scenes == null)
            {
                return NotFound();
            }

            return scenes;
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
                if (id <= 0)
                {
                    return BadRequest("Invalid scene ID");
                }

                // First check if the scene exists
                var sceneExists = await _context.Scenes.AnyAsync(s => s.SceneID == id);
                if (!sceneExists)
                {
                    return NotFound($"Scene {id} does not exist");
                }

                var connections = await _context.ChoicesConnections
                    .Where(c => c.SceneFromID == id)
                    .ToListAsync();

                // Return empty array instead of 404 when there are no choices
                var options = connections.Select(c => new
                {
                    optionId = c.ChoicesConnectionsID,
                    text = c.Text ?? "Continue...",
                    nextSceneId = c.SceneToID
                }).ToList();

                return Ok(options); // This will return [] if there are no options
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetSceneOptions: {ex.Message}");
                return StatusCode(500, "Error fetching scene options");
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
    }
}
