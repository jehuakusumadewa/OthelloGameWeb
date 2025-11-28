using OthelloApi.Services;
using OthelloApi.Models;
using OthelloApi.Interfaces;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register our services
builder.Services.AddSingleton<IOthelloService, OthelloService>();
builder.Services.AddSingleton<OthelloGame>(serviceProvider =>
{
    var players = new List<IPlayer>
    {
        new Player { Name = "Player1", Color = DiskColor.Black },
        new Player { Name = "Player2", Color = DiskColor.White }
    };
    
    var board = new GameBoard();
    var directions = new List<Position>
    {
        new Position(-1, -1), new Position(-1, 0), new Position(-1, 1),
        new Position(0, -1),                      new Position(0, 1),
        new Position(1, -1),  new Position(1, 0),  new Position(1, 1)
    };
    
    return new OthelloGame(players, board, 8, GameStatus.NotStart, players[0], directions);
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

app.Run();