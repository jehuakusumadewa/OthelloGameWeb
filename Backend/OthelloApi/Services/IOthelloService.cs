// Services/IOthelloService.cs
using OthelloApi.DTOs;

namespace OthelloApi.Services
{
    public interface IOthelloService
    {
        Guid CreateGame(CreateGameDto gameDto);
        GameStateDto GetGameState(Guid gameId);
        GameStateDto MakeMove(Guid gameId, MakeMoveDto move);
    }
}