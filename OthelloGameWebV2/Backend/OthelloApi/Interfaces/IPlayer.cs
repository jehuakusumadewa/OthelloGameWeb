// Interfaces/IPlayer.cs
using OthelloApi.Models;

namespace OthelloApi.Interfaces
{
    public interface IPlayer
    {
        string Name { get; set; }
        DiskColor Color { get; set; }
    }
}