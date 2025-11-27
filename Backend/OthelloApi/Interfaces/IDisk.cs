// Interfaces/IDisk.cs
using OthelloApi.Models;

namespace OthelloApi.Interfaces
{
    public interface IDisk
    {
        DiskColor Color { get; set; }
        Position Position { get; set; }
    }
}