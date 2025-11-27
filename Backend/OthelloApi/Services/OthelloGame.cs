// Core/OthelloGame.cs
using OthelloApi.Interfaces;
using OthelloApi.Models;

namespace OthelloApi.Services
{
    public class OthelloGame
    {
        private IBoard _board;
        private List<IPlayer> _players;
        private IPlayer _currentPlayer;
        public GameStatus Status;
        private int _size;
        private readonly List<Position> _directions;
        
        // TAMBAHAN: Delegate untuk events
        public Action<IPlayer> OnTurnChanged { get; set; }
        public Action<string> OnGameEvent { get; set; }
        public Action<IPlayer, Position> OnMoveMade { get; set; }

        public OthelloGame(List<IPlayer> players, IBoard board, int size, GameStatus status, IPlayer currentPlayer, List<Position> directions)
        {
            _board = board;
            _size = size;
            Status = status;
            _currentPlayer = currentPlayer;
            _players = players;
            _directions = directions;
            
            // TAMBAHAN: Initialize default actions untuk logging
            OnTurnChanged = (player) => LogMessage($"🎮 Giliran {player.Name} ({player.Color})");
            OnGameEvent = (message) => LogMessage(message);
            OnMoveMade = (player, position) => LogMessage($"📍 {player.Name} meletakkan disk di ({position.X}, {position.Y})");
        }

        // TAMBAHAN: Method untuk logging
        private void LogMessage(string message)
        {
            // Console logging untuk debugging
            Console.WriteLine($"[OthelloGame] {DateTime.Now:HH:mm:ss} - {message}");
        }

        private void InitializeBoard()
        {
            _board.Squares = new ICell[_size, _size];
            
            for (int i = 0; i < _size; i++)
            {
                for (int j = 0; j < _size; j++)
                {
                    _board.Squares[i, j] = new Cell
                    {
                        Position = new Position(i, j)
                    };
                }
            }
        }

        public void StartGame()
        {
            Status = GameStatus.Play; 
            InitializeBoard();
            InitializeBoardDisks();
            
            // TAMBAHAN: Trigger game start event
            OnGameEvent?.Invoke("🎯 Game Othello dimulai!");
            OnTurnChanged?.Invoke(_currentPlayer);
        }

        public bool IsGameActive()
        {
            return Status == GameStatus.Play; 
        }

        public bool CurrentPlayerHasValidMoves()
        {
            return HasValidMove(_currentPlayer);
        }

        public bool ProcessMove(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) 
                return false;
            
            string[] parts = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 2) 
                return false;
            
            if (!int.TryParse(parts[0], out int row) || !int.TryParse(parts[1], out int col))
                return false;

            row--;
            col--;

            if (row < 0 || row >= _size || col < 0 || col >= _size)
                return false;

            Position move = new Position(row, col);
            if (!IsValidMove(move, _currentPlayer))
                return false;

            MakeMove(move);
            return true;
        }

        public void SkipTurn()
        {
            OnGameEvent?.Invoke($"⏭️ {_currentPlayer.Name} skip turn");
            SwitchPlayer();
            
            if (!HasValidMove(_currentPlayer))
            {
                FinishGame();
            }
        }

        public void MakeMove(Position position)
        {
            var newDisk = new GameDisk { Color = _currentPlayer.Color };
            PlaceDisk(position, newDisk);
            FlipDisks(position, _currentPlayer.Color);
            
            // TAMBAHAN: Trigger move event
            OnMoveMade?.Invoke(_currentPlayer, position);
            
            SwitchPlayer();
        }

        public void SwitchPlayer()
        {
            _currentPlayer = (_currentPlayer == _players[0]) ? _players[1] : _players[0];
            
            // TAMBAHAN: Trigger turn changed event
            OnTurnChanged?.Invoke(_currentPlayer);
        }

        private void InitializeBoardDisks()
        {
            PlaceDisk(new Position(3, 3), new GameDisk { Color = DiskColor.White });
            PlaceDisk(new Position(3, 4), new GameDisk { Color = DiskColor.Black });
            PlaceDisk(new Position(4, 3), new GameDisk { Color = DiskColor.Black });
            PlaceDisk(new Position(4, 4), new GameDisk { Color = DiskColor.White });
            
            OnGameEvent?.Invoke("⚫⚪ Disk awal ditempatkan");
        }

        private void PlaceDisk(Position position, IDisk disk)
        {
            disk.Position = position;
            _board.Squares[position.X, position.Y].Disk = disk;
        }

        public IPlayer? GetPlayerByColor(DiskColor color)
        {
            return _players.Find(p => p.Color == color);
        }

        public IPlayer GetCurrentPlayer()
        {
            return _currentPlayer;
        }

        public List<Position> GetValidMoves()
        {
            return GetPossibleMovesForPlayer(_currentPlayer);
        }

        private List<Position> GetPossibleMovesForPlayer(IPlayer player)
        {
            var validMoves = new List<Position>();
            
            for (int i = 0; i < _size; i++)
            {
                for (int j = 0; j < _size; j++)
                {
                    var position = new Position(i, j);
                    if (IsValidMove(position, player))
                    {
                        validMoves.Add(position);
                    }
                }
            }
            
            return validMoves;
        }

        public bool IsValidMove(Position position, IPlayer player)
        {
            if (position.X < 0 || position.X >= _size || position.Y < 0 || position.Y >= _size || 
                _board.Squares[position.X, position.Y].Disk != null)
                return false;

            DiskColor opponentColor = (player.Color == DiskColor.Black) ? DiskColor.White : DiskColor.Black;

            foreach (var direction in _directions)
            {
                if (CheckDirection(position, direction, player.Color, opponentColor))
                    return true;
            }
            
            return false;
        }

        private bool CheckDirection(Position position, Position direction, DiskColor playerColor, DiskColor opponentColor)
        {
            int x = position.X + direction.X;
            int y = position.Y + direction.Y;
            bool foundOpponent = false;

            while (x >= 0 && x < _size && y >= 0 && y < _size && 
                   _board.Squares[x, y].Disk != null && 
                   _board.Squares[x, y].Disk.Color == opponentColor)
            {
                foundOpponent = true;
                x += direction.X;
                y += direction.Y;
            }

            if (foundOpponent && x >= 0 && x < _size && y >= 0 && y < _size && 
                _board.Squares[x, y].Disk != null && 
                _board.Squares[x, y].Disk.Color == playerColor)
            {
                return true;
            }
            
            return false;
        }

        public bool HasValidMove(IPlayer player)
        {
            return GetPossibleMovesForPlayer(player).Count > 0;
        }

        private void FlipDisks(Position position, DiskColor playerColor)
        {
            DiskColor opponentColor = (playerColor == DiskColor.Black) ? DiskColor.White : DiskColor.Black;

            foreach (var direction in _directions)
            {
                FlipDirection(position, direction, playerColor, opponentColor);
            }
        }

        public IPlayer GetOpponent(IPlayer currentPlayer)
        {
            if (_players[0] == currentPlayer)
                return _players[1];
            else
                return _players[0];
        }

        private void FlipDirection(Position position, Position direction, DiskColor playerColor, DiskColor opponentColor)
        {
            int x = position.X + direction.X;
            int y = position.Y + direction.Y;
            var disksToFlip = new List<Position>();

            while (x >= 0 && x < _size && y >= 0 && y < _size && 
                   _board.Squares[x, y].Disk != null && 
                   _board.Squares[x, y].Disk.Color == opponentColor)
            {
                disksToFlip.Add(new Position(x, y));
                x += direction.X;
                y += direction.Y;
            }

            if (x >= 0 && x < _size && y >= 0 && y < _size && 
                _board.Squares[x, y].Disk != null && 
                _board.Squares[x, y].Disk.Color == playerColor)
            {
                foreach (var flipPos in disksToFlip)
                {
                    _board.Squares[flipPos.X, flipPos.Y].Disk.Color = playerColor;
                }
            }
        }

        public bool IsGameOver()
        {
            return Status == GameStatus.Win || Status == GameStatus.Draw; 
        }

        public IPlayer? GetWinner()
        {
            if (Status != GameStatus.Win) return null; 

            int blackScore = GetPlayerScore(GetPlayerByColor(DiskColor.Black));
            int whiteScore = GetPlayerScore(GetPlayerByColor(DiskColor.White));

            if (blackScore > whiteScore)
                return GetPlayerByColor(DiskColor.Black);
            else if (whiteScore > blackScore)
                return GetPlayerByColor(DiskColor.White);
            else
                return null;
        }

        public int GetPlayerScore(IPlayer? player)
        {
            int count = 0;
            for (int i = 0; i < _size; i++)
            {
                for (int j = 0; j < _size; j++)
                {
                    var disk = _board.Squares[i, j].Disk;
                    if (disk != null && disk.Color == player?.Color)
                    {
                        count++;
                    }
                }
            }
            return count;
        }

        public void FinishGame()
        {
            int blackScore = GetPlayerScore(GetPlayerByColor(DiskColor.Black));
            int whiteScore = GetPlayerScore(GetPlayerByColor(DiskColor.White));

            // TAMBAHAN: Trigger game finish event
            if (blackScore > whiteScore)
            {
                Status = GameStatus.Win; 
                var winner = GetPlayerByColor(DiskColor.Black);
                OnGameEvent?.Invoke($"🏆 {winner?.Name} menang dengan skor {blackScore}-{whiteScore}!");
            }
            else if (whiteScore > blackScore)
            {
                Status = GameStatus.Win; 
                var winner = GetPlayerByColor(DiskColor.White);
                OnGameEvent?.Invoke($"🏆 {winner?.Name} menang dengan skor {whiteScore}-{blackScore}!");
            }
            else
            {
                Status = GameStatus.Draw;
                OnGameEvent?.Invoke($"🤝 Seri! Skor {blackScore}-{whiteScore}");
            }
        }

        public IBoard GetBoard()
        {
            return _board;
        }

        public int GetBoardSize()
        {
            return _size;
        }

        public List<IPlayer> GetPlayers()
        {
            return _players;
        }

        public GameStatus GetGameStatus()
        {
            return Status;
        }
    }
}