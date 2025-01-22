using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;
using stinsily.Server.Models;
using Microsoft.AspNetCore.Authorization;

namespace stinsily.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChoicesConnectionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChoicesConnectionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChoicesConnections>>> GetChoicesConnections()
        {
            return await _context.ChoicesConnections
                .Include(cc => cc.SceneFrom)
                .Include(cc => cc.SceneTo)
                .Include(cc => cc.RequiredItem)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ChoicesConnections>> GetChoicesConnections(int id)
        {
            var choicesConnections = await _context.ChoicesConnections
                .Include(cc => cc.SceneFrom)
                .Include(cc => cc.SceneTo)
                .Include(cc => cc.RequiredItem)
                .FirstOrDefaultAsync(cc => cc.ChoicesConnectionsID == id);

            if (choicesConnections == null)
            {
                return NotFound();
            }

            return choicesConnections;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutChoicesConnections(int id, ChoicesConnections choicesConnections)
        {
            if (id != choicesConnections.ChoicesConnectionsID)
            {
                return BadRequest();
            }

            // Detach navigation properties before update
            choicesConnections.SceneFrom = null;
            choicesConnections.SceneTo = null;
            choicesConnections.RequiredItem = null;
            choicesConnections.MiniGame = null;

            _context.Entry(choicesConnections).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ChoicesConnectionsExists(id))
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

        [HttpPost]
        public async Task<ActionResult<ChoicesConnections>> PostChoicesConnections(ChoicesConnections choicesConnections)
        {
            _context.ChoicesConnections.Add(choicesConnections);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetChoicesConnections", new { id = choicesConnections.ChoicesConnectionsID }, choicesConnections);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChoicesConnections(int id)
        {
            var choicesConnections = await _context.ChoicesConnections.FindAsync(id);
            if (choicesConnections == null)
            {
                return NotFound();
            }

            _context.ChoicesConnections.Remove(choicesConnections);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ChoicesConnectionsExists(int id)
        {
            return _context.ChoicesConnections.Any(e => e.ChoicesConnectionsID == id);
        }
    }
}
