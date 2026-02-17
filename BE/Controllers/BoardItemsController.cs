using BE.Data;
using BE.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardItemsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BoardItemsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoardItem>>> GetBoardItems()
    {
        return await _context.BoardItems.ToListAsync();
    }
}
