using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
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

        [HttpGet("current-scene")]
        public async Task<IActionResult> GetCurrentScene()
        {
            var identityUser = await _context.Users.OfType<IdentityUser>()
                .FirstOrDefaultAsync(u => u.Id == User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            if (identityUser == null) return Unauthorized();

            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(identityUser.Id));

            if (player == null) return NotFound("Player not found");

            return Ok(player.CurrentScene);
        }

        [HttpGet("available-scenes")]
        public async Task<IActionResult> GetAvailableScenes()
        {
            var identityUser = await _context.Users.OfType<IdentityUser>()
                .FirstOrDefaultAsync(u => u.Id == User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (identityUser == null) return Unauthorized();

            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(identityUser.Id));

            if (player == null) return NotFound("Player not found");

            if (player.CurrentScene == null) return NotFound("Current scene not found");

            var availableScenes = await _context.ChoicesConnections
                .Where(cc => cc.SceneFromID == player.CurrentScene.SceneID)
                .Select(cc => new
                {
                    SceneTo = cc.SceneToID,
                    Text = cc.Text,
                    RequiredItemID = cc.RequiredItemID
                })
                .ToListAsync();

            return Ok(availableScenes);
        }

        [HttpGet("options")]
        public async Task<IActionResult> GetSceneOptions()
        {
            var identityUser = await _context.Users.OfType<IdentityUser>()
                .FirstOrDefaultAsync(u => u.Id == User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            if (identityUser == null) return Unauthorized();

            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(identityUser.Id));

            if (player == null) return NotFound("Player not found");

            var choices = await _context.ChoicesConnections
                .Where(cc => cc.SceneFromID == player.CurrentSceneID)
                .Select(cc => new
                {
                    cc.SceneToID,
                    cc.Text,
                    cc.RequiredItemID,
                    MiniGame = _context.MiniGames.FirstOrDefault(mg => mg.MiniGameID == cc.MiniGameID)
                })
                .ToListAsync();

            return Ok(new
            {
                CurrentScene = new
                {
                    player.CurrentScene.SceneID,
                    player.CurrentScene.Title,
                    player.CurrentScene.Description
                },
                Options = choices.Select(choice => new
                {
                    TargetSceneID = choice.SceneToID,
                    ActionText = choice.Text,
                    RequiredItemID = choice.RequiredItemID,
                    MiniGame = choice.MiniGame != null ? new
                    {
                        choice.MiniGame.MiniGameID,
                        choice.MiniGame.Description
                    } : null
                })
            });
        }


        // PUT: api/Scenes/5
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
        [HttpPost]
        public async Task<ActionResult<Scenes>> PostScenes(Scenes scenes)
        {
            _context.Scenes.Add(scenes);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetScenes", new { id = scenes.SceneID }, scenes);
        }

        [HttpPost("move-to-scene")]
        public async Task<IActionResult> MoveToScene([FromBody] int targetSceneId)
        {
            var identityUser = await _context.Users.OfType<IdentityUser>()
                .FirstOrDefaultAsync(u => u.Id == User.FindFirstValue(ClaimTypes.NameIdentifier));

            if (identityUser == null) return Unauthorized();

            var player = await _context.Players
                .Include(p => p.CurrentScene)
                .Include(p => p.ItemID)
                .Include(p => p.Health)
                .Include(p => p.Force)
                .Include(p => p.ObiWanRelationship)
                .FirstOrDefaultAsync(p => p.UserID == int.Parse(identityUser.Id));

            if (player == null) return NotFound("Player not found");

            var connection = await _context.ChoicesConnections
                .FirstOrDefaultAsync(cc => cc.SceneFromID == player.CurrentScene.SceneID && cc.SceneToID == targetSceneId);

            if (connection == null) return BadRequest("Invalid target scene");

            var playerItems = await _context.Items
                .Where(i => i.ItemID == player.ItemID)
                .ToListAsync();

            if (connection.RequiredItemID != null &&
                !playerItems.Any(i => i.ItemID == connection.RequiredItemID))
            {
                return BadRequest("You do not have the required item to move to this scene");
            }

            player.CurrentSceneID = targetSceneId;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Scene changed successfully" });
        }

        // DELETE: api/Scenes/5
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
