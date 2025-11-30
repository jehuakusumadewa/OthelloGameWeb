using Microsoft.AspNetCore.Mvc;
using OthelloApi.DTOs;
using OthelloApi.Services;
using OthelloApi.Models;

namespace OthelloApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OthelloController : ControllerBase
    {
        private readonly IOthelloService _othelloService;

        public OthelloController(IOthelloService othelloService)
        {
            _othelloService = othelloService;
        }

        [HttpPost]
        public IActionResult CreateGame([FromBody] CreateGameDto gameDto, OthelloGame othelloGame)
        {
            try
            {
                var Otto = othelloGame;
                var gameId = _othelloService.CreateGame(gameDto, Otto);
                return Ok(new { GameId = gameId, Message = "Game created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpGet("{gameId}")]
        public IActionResult GetGameState(Guid gameId)
        {
            try
            {
                var gameState = _othelloService.GetGameState(gameId);
                
                // PERBAIKAN: Periksa apakah GameResult adalah success
                if (!gameState.IsSuccess)
                {
                    return BadRequest(new { Error = gameState.ErrorMessage });
                }
                
                return Ok(gameState);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Game not found" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPost("{gameId}/move")]
        public IActionResult MakeMove(Guid gameId, [FromBody] MakeMoveDto move)
        {
            try
            {
                var gameState = _othelloService.MakeMove(gameId, move);
                
                // PERBAIKAN: Periksa apakah GameResult adalah success
                if (!gameState.IsSuccess)
                {
                    return BadRequest(new { Error = gameState.ErrorMessage });
                }
                
                return Ok(gameState);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { Error = "Game not found" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}