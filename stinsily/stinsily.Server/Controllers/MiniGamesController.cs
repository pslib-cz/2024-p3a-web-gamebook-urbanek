using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using stinsily.Server.Data;
using stinsily.Server.Models;

namespace stinsily.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MiniGamesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MiniGamesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MiniGames>>> GetMiniGames()
        {
            return await _context.MiniGames.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MiniGames>> GetMiniGames(int id)
        {
            var miniGames = await _context.MiniGames.FindAsync(id);

            if (miniGames == null)
            {
                return NotFound();
            }

            return miniGames;
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMiniGames(int id, MiniGames miniGames)
        {
            if (id != miniGames.MiniGameID)
            {
                return BadRequest();
            }

            _context.Entry(miniGames).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MiniGamesExists(id))
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
        public async Task<ActionResult<MiniGames>> PostMiniGames(MiniGames miniGames)
        {
            _context.MiniGames.Add(miniGames);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetMiniGames", new { id = miniGames.MiniGameID }, miniGames);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMiniGames(int id)
        {
            var miniGames = await _context.MiniGames.FindAsync(id);
            if (miniGames == null)
            {
                return NotFound();
            }

            _context.MiniGames.Remove(miniGames);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MiniGamesExists(int id)
        {
            return _context.MiniGames.Any(e => e.MiniGameID == id);
        }
    }
}
