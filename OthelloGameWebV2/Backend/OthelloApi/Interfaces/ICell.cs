// Interfaces/ICell.cs
using OthelloApi.Models;

namespace OthelloApi.Interfaces
{
    public interface ICell
    {
        Position Position { get; set; }
        IDisk Disk { get; set; }
    }
}