// Models/Player.cs
using OthelloApi.Interfaces;

namespace OthelloApi.Models
{
    public class Player : IPlayer
    {
        public required string Name { get; set; }
        public DiskColor Color { get; set; }
    }
}