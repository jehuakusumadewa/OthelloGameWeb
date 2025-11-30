// Interfaces/IBoard.cs
using OthelloApi.Models;

namespace OthelloApi.Interfaces
{
    public interface IBoard
    {
        ICell[,] Squares { get; set; }
    }
}