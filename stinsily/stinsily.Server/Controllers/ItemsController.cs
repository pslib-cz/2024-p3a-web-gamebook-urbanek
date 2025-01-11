using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using stinsily.Server.Data;
using stinsily.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace stinsily.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ItemsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ItemsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("is-admin")]
        [Authorize] // Pouze přihlášení uživatelé
        public IActionResult IsAdmin()
        {
            var isAdmin = User.IsInRole("Admin"); // Ověření role admin
            return Ok(isAdmin); // Vrací true nebo false
        }

        [HttpPost]
        public IActionResult AddItem([FromBody] Items item)
        {
            // Logika pro přidání položky
            _context.Items.Add(item);
            _context.SaveChanges();

            return Ok("Item added successfully.");
        }

        // GET: api/Items
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Items>>> GetItems()
        {
            return await _context.Items.ToListAsync();
        }

        // GET: api/Items/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Items>> GetItems(int id)
        {
            var items = await _context.Items.FindAsync(id);

            if (items == null)
            {
                return NotFound();
            }

            return items;
        }

        // PUT: api/Items/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutItems(int id, Items items)
        {
            try
            {
                var item = await _context.Items.FindAsync(id);
                if (item == null)
                {
                    return NotFound($"Item with ID {id} not found");
                }

                // Update properties
                item.Name = items.Name;
                item.Description = items.Description;
                item.HealthModifier = items.HealthModifier;
                item.ForceModifier = items.ForceModifier;
                item.ObiWanRelationshipModifier = items.ObiWanRelationshipModifier;

                _context.Update(item);
                await _context.SaveChangesAsync();

                return Ok(item);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating item: {ex.Message}");
            }
        }

        // DELETE: api/Items/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteItems(int id)
        {
            var items = await _context.Items.FindAsync(id);
            if (items == null)
            {
                return NotFound();
            }

            _context.Items.Remove(items);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ItemsExists(int id)
        {
            return _context.Items.Any(e => e.ItemID == id);
        }
    }
}
