using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;   

namespace stinsily.Server.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Policy = "Admin")] // Povolení pouze pro adminy
    public class AdminController : ControllerBase
    {
        [HttpPost("add")]
        public IActionResult AddRecord([FromBody] object record)
        {
            // Logika pro přidání záznamu
            return Ok("Record added.");
        }

        [HttpPut("update/{id}")]
        public IActionResult UpdateRecord(int id, [FromBody] object record)
        {
            // Logika pro aktualizaci záznamu
            return Ok("Record updated.");
        }
    }
}
