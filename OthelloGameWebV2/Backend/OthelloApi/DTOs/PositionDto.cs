// DTOs/PositionDto.cs
namespace OthelloApi.DTOs
{
    public class PositionDto
    {
        public int X { get; set; }
        public int Y { get; set; }

        public PositionDto(int x, int y)
        {
            X = x;
            Y = y;
        }
    }
}