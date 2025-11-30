// Models/GameDisk.cs
using OthelloApi.Interfaces;

namespace OthelloApi.Models
{
    public class GameDisk : IDisk
    {
        public DiskColor Color { get; set; }
        public Position Position { get; set; }
    }
}