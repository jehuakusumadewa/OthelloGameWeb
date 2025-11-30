// Services/IOthelloService.cs
using OthelloApi.DTOs;
using OthelloApi.Models;

namespace OthelloApi.Services
{
    public interface IOthelloService
    {
        Guid CreateGame(CreateGameDto gameDto, OthelloGame gameOtto);
        GameResult<GameStateDto> GetGameState(Guid gameId);
        GameResult<GameStateDto> MakeMove(Guid gameId, MakeMoveDto move);
    }
}