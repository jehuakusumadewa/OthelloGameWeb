// Models/Cell.cs
using OthelloApi.Interfaces;

namespace OthelloApi.Models
{
    public class Cell : ICell
    {
        public Position Position { get; set; }
        public IDisk Disk { get; set; }
    }
}