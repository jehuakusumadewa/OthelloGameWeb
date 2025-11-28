// Services/OthelloService.cs
using Microsoft.Extensions.Logging; 
using OthelloApi.DTOs;
using OthelloApi.Interfaces;
using OthelloApi.Models;

namespace OthelloApi.Services
{
    public class OthelloService : IOthelloService
    {
        private readonly Dictionary<Guid, OthelloGame> _games;
        private readonly ILogger<OthelloService> _logger;

        // Constructor dengan ILogger
        public OthelloService(ILogger<OthelloService> logger)
        {
            _games = new Dictionary<Guid, OthelloGame>();
            _logger = logger;
            
            _logger.LogInformation("OthelloService initialized");
        }

        public Guid CreateGame(CreateGameDto gameDto, OthelloGame gameOtto)
        {
            var gameId = Guid.NewGuid();
            // Gunakan OthelloGame
            var game = gameOtto;
            
            // Setup event handlers dengan logging
            game.OnGameEvent += (message) => 
                _logger.LogInformation("[GameEvent] {Message}", message);
                
            game.OnTurnChanged += (player) => 
                _logger.LogInformation("[TurnChanged] Sekarang giliran: {PlayerName} ({Color})", 
                    player.Name, player.Color);
                
            game.OnMoveMade += (player, position) => 
                _logger.LogInformation("[MoveMade] {PlayerName} move di ({Row}, {Col})", 
                    player.Name, position.X, position.Y);
            
            game.StartGame();
            
            _games[gameId] = game;
            
            _logger.LogInformation("Game created: {GameId} - {Player1} vs {Player2}", 
                gameId, game.GetCurrentPlayer().Name, game.GetOpponent(game.GetCurrentPlayer()).Name);
                
            return gameId;
        }


        public GameResult<GameStateDto> GetGameState(Guid gameId)
        {
            if (!_games.ContainsKey(gameId))
                GameResult<GameStateDto>.Failure("Game not found");

            var game = _games[gameId];
            return MapToGameStateDto(gameId, game);
        }

        public GameResult<GameStateDto> MakeMove(Guid gameId, MakeMoveDto move)
        {
            if (!_games.ContainsKey(gameId))
                GameResult<GameStateDto>.Failure("Game not found");

            var game = _games[gameId];
            
            if (!game.IsGameActive())
                GameResult<GameStateDto>.Failure("Game is not active");

            var position = new Position(move.Row, move.Column);
            
            if (!game.IsValidMove(position, game.GetCurrentPlayer()))
                GameResult<GameStateDto>.Failure("Invalid move");

            game.MakeMove(position);
            
            // FIXED: Check if the new current player has valid moves
            // If not, switch player again until we find one with valid moves or game ends
            while (game.Status == GameStatus.Play && !game.HasValidMove(game.GetCurrentPlayer()))
            {
                var opponent = game.GetOpponent(game.GetCurrentPlayer());
                
                if (!game.HasValidMove(opponent))
                {
                    // Both players have no valid moves - game over
                    game.FinishGame();
                    break;
                }
                else
                {
                    // Only current player has no valid moves - skip turn
                    game.SwitchPlayer();
                }
            }

            return MapToGameStateDto(gameId, game);
        }

        private GameResult<GameStateDto> MapToGameStateDto(Guid gameId, OthelloGame game)
        {
            var board = game.GetBoard();
            var size = game.GetBoardSize();
            var boardDto = new List<List<CellDto>>();
            
            for (int i = 0; i < size; i++)
            {
                var row = new List<CellDto>();
                for (int j = 0; j < size; j++)
                {
                    var cell = board.Squares[i, j];
                    row.Add(new CellDto
                    {
                        Row = i,
                        Column = j,
                        DiskColor = cell.Disk?.Color
                    });
                }
                boardDto.Add(row);
            }

            var validMoves = game.GetValidMoves().Select(m => new PositionDto(m.X, m.Y)).ToList();
            var currentPlayer = game.GetCurrentPlayer();
            var blackScore = game.GetPlayerScore(game.GetPlayerByColor(DiskColor.Black));
            var whiteScore = game.GetPlayerScore(game.GetPlayerByColor(DiskColor.White));
            var winner = game.GetWinner();

            var gameStateDao =  new GameStateDto
                                {
                                    GameId = gameId,
                                    CurrentPlayer = currentPlayer.Name,
                                    CurrentPlayerColor = currentPlayer.Color,
                                    Status = game.GetGameStatus(),
                                    Board = boardDto,
                                    ValidMoves = validMoves,
                                    BlackScore = blackScore,
                                    WhiteScore = whiteScore,
                                    Winner = winner?.Name ?? string.Empty
                                };

            return GameResult<GameStateDto>.Success(gameStateDao);
        }
    }
}