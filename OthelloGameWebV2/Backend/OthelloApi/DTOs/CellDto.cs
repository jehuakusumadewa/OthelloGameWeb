// DTOs/CellDto.cs
using OthelloApi.Models;

namespace OthelloApi.DTOs
{
        public class CellDto
    {
        public int Row { get; set; }
        public int Column { get; set; }
        public DiskColor? DiskColor { get; set; }
    }
}