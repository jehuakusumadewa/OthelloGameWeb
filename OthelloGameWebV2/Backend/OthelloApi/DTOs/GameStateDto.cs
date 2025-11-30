// DTOs/GameStateDto.cs
using OthelloApi.Models;

namespace OthelloApi.DTOs
{
    public class GameStateDto
    {
        public Guid GameId { get; set; }
        public string? CurrentPlayer { get; set; }
        public DiskColor CurrentPlayerColor { get; set; }
        public GameStatus Status { get; set; }
        public List<List<CellDto>>? Board { get; set; }
        public List<PositionDto>? ValidMoves { get; set; }
        public int BlackScore { get; set; }
        public int WhiteScore { get; set; }
        public string? Winner { get; set; }
    }




}