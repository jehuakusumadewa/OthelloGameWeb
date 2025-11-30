// Models/GameBoard.cs
using OthelloApi.Interfaces;

namespace OthelloApi.Models
{
    public class GameBoard : IBoard
    {
        public  ICell[,] Squares { get; set; }
    }
}