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

        // GET: api/Scenes/5
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
        [HttpGet("current-scene")]
        public async Task<IActionResult> GetCurrentScene()
        {
            try
            {
                var user = await _userManager.GetUserAsync(User);
                var player = await _context.Players
                    .Include(p => p.CurrentScene)
                    .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

                if (player?.CurrentScene == null)
                {
                    // If no current scene, set it to Scene1
                    var defaultScene = await _context.Scenes.FirstOrDefaultAsync(s => s.SceneID == 1);
                    if (defaultScene == null)
                        return NotFound("Default scene not found");

                    player.CurrentScene = defaultScene;
                    await _context.SaveChangesAsync();
                }

                var connections = await _context.ChoicesConnections
                    .Where(c => c.SceneFromID == player.CurrentScene.SceneID)
                    .ToListAsync();

                var response = new
                {
                    scene = player.CurrentScene,
                    availableConnections = connections.Select(c => new
                    {
                        connectionId = c.ChoicesConnectionsID,
                        text = c.Text,
                        nextSceneId = c.SceneToID
                    })
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize]
        [HttpGet("available-scenes")]
        public async Task<IActionResult> GetAvailableScenes()
        {
            var user = await _userManager.GetUserAsync(User);
            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .Include(p => p.ItemID)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

            if (player?.CurrentScene == null)
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

        [Authorize]
        [HttpGet("options/{sceneId}")]
        public async Task<IActionResult> GetSceneOptions(int sceneId)
        {
            var user = await _userManager.GetUserAsync(User);
            var player = await _context.Players
                .Include(p => p.ItemID)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(user.Id));

            var options = await _context.ChoicesConnections
                .Where(cc => cc.SceneFromID == sceneId)
                .Where(cc => cc.RequiredItemID == null || 
                            player.ItemID == cc.RequiredItemID)
                .Select(cc => new
                {
                    optionId = cc.ChoicesConnectionsID,
                    text = cc.Text,
                    nextSceneId = cc.SceneToID
                })
                .ToListAsync();

            return Ok(options);
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
