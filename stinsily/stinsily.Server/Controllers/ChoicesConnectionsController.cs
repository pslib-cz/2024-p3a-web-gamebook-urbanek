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
    public class ChoicesConnectionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChoicesConnectionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ChoicesConnections
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ChoicesConnections>>> GetChoicesConnections()
        {
            return await _context.ChoicesConnections.ToListAsync();
        }

        // GET: api/ChoicesConnections/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ChoicesConnections>> GetChoicesConnections(int id)
        {
            var choicesConnections = await _context.ChoicesConnections.FindAsync(id);

            if (choicesConnections == null)
            {
                return NotFound();
            }

            return choicesConnections;
        }

        // PUT: api/ChoicesConnections/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutChoicesConnections(int id, ChoicesConnections choicesConnections)
        {
            if (id != choicesConnections.ChoicesConnectionsID)
            {
                return BadRequest();
            }

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

        // POST: api/ChoicesConnections
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ChoicesConnections>> PostChoicesConnections(ChoicesConnections choicesConnections)
        {
            _context.ChoicesConnections.Add(choicesConnections);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetChoicesConnections", new { id = choicesConnections.ChoicesConnectionsID }, choicesConnections);
        }

        // DELETE: api/ChoicesConnections/5
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
