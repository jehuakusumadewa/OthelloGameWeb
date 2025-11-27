// Configuration
const BASE_URL = "http://localhost:5242";
let currentGameId = null;
let validMoves = [];

// DOM Elements
const gameBoard = document.getElementById("gameBoard");
const player1Element = document.getElementById("player1");
const player2Element = document.getElementById("player2");
const score1Element = document.getElementById("score1");
const score2Element = document.getElementById("score2");
const currentTurnElement = document.getElementById("currentTurn");
const player1NameElement = document.getElementById("player1Name");
const player2NameElement = document.getElementById("player2Name");
const player1NameInput = document.getElementById("player1NameInput");
const player2NameInput = document.getElementById("player2NameInput");
const createGameBtn = document.getElementById("createGameBtn");
const statusMessage = document.getElementById("statusMessage");

// TAMBAHAN: Winner section elements
const winnerSection = document.getElementById("winnerSection");
const winnerMessage = document.getElementById("winnerMessage");
const finalBlackScore = document.getElementById("finalBlackScore");
const finalWhiteScore = document.getElementById("finalWhiteScore");
const newGameBtn = document.getElementById("newGameBtn");

// Initialize the game board
function initializeBoard() {
  gameBoard.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", () => makeMove(row, col));
      gameBoard.appendChild(cell);
    }
  }
}

// Update the board display
function updateBoard(board) {
  console.log("Board data:", board);

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.innerHTML = "";
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // Remove valid move indicator
    cell.classList.remove("valid-move");

    const cellData = board[row][col];
    if (cellData.diskColor !== null) {
      const piece = document.createElement("div");
      piece.className = `piece ${cellData.diskColor === 1 ? "black" : "white"}`;
      cell.appendChild(piece);
    }
  });

  // Highlight valid moves
  if (validMoves && validMoves.length > 0) {
    validMoves.forEach((move) => {
      const cell = document.querySelector(
        `.cell[data-row="${move.x}"][data-col="${move.y}"]`
      );
      if (cell && !cell.querySelector(".piece")) {
        cell.classList.add("valid-move");
      }
    });
  }
}

// Update game info
function updateGameInfo(gameState) {
  console.log("Game state for update:", gameState);

  // Update player names dengan nama dari input
  const player1Name = player1NameInput.value.trim() || "Player 1";
  const player2Name = player2NameInput.value.trim() || "Player 2";

  player1NameElement.textContent = `${player1Name} (Black)`;
  player2NameElement.textContent = `${player2Name} (White)`;

  // Update scores
  score1Element.textContent = gameState.blackScore;
  score2Element.textContent = gameState.whiteScore;

  // Update current turn
  currentTurnElement.textContent = `${gameState.currentPlayer}'s Turn (${
    gameState.currentPlayerColor === 1 ? "Black" : "White"
  })`;

  // Highlight active player
  if (gameState.currentPlayerColor === 1) {
    player1Element.classList.add("active");
    player2Element.classList.remove("active");
  } else {
    player1Element.classList.remove("active");
    player2Element.classList.add("active");
  }

  // TAMBAHAN: Check if game is finished and show winner
  if (gameState.status === 2 || gameState.status === 3) {
    // GameStatus.Finished = 2
    showWinner(gameState);
  } else {
    hideWinner();
  }
}

// TAMBAHAN: Show winner section
function showWinner(gameState) {
  const player1Name = player1NameInput.value.trim() || "Player 1";
  const player2Name = player2NameInput.value.trim() || "Player 2";

  let message = "";
  if (gameState.winner === null) {
    message = "It's a Draw! 🤝";
  } else if (gameState.winner === player1Name) {
    message = `🎊 ${player1Name} Wins! 🎊`;
  } else if (gameState.winner === player2Name) {
    message = `🎊 ${player2Name} Wins! 🎊`;
  } else {
    message = `🎊 ${gameState.winner} Wins! 🎊`;
  }

  winnerMessage.textContent = message;
  finalBlackScore.textContent = gameState.blackScore;
  finalWhiteScore.textContent = gameState.whiteScore;

  winnerSection.classList.remove("hidden");

  // Disable board clicks when game is finished
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.style.pointerEvents = "none";
  });
}

// TAMBAHAN: Hide winner section
function hideWinner() {
  winnerSection.classList.add("hidden");

  // Enable board clicks
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.style.pointerEvents = "auto";
  });
}

function startNewGame() {
  const player1Name = player1NameInput.value.trim() || "Player 1";
  const player2Name = player2NameInput.value.trim() || "Player 2";

  if (!player1Name || !player2Name) {
    showStatus("Please enter player names", "error");
    return;
  }

  // Reset game state
  hideWinner();
  currentGameId = null;
  validMoves = [];

  // Create new game
  createGame(player1Name, player2Name);

  showStatus("Starting new game...", "info");
}

// Show status message
function showStatus(message, type = "info") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusMessage.textContent = "";
    statusMessage.className = "status-message";
  }, 5000);
}

// Create new game
async function createGame(player1Name, player2Name) {
  try {
    const response = await fetch(`${BASE_URL}/api/othello`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player1Name,
        player2Name,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create game: ${response.statusText}`);
    }

    const game = await response.json();
    console.log("Create game response:", game);

    // Store the game ID globally
    currentGameId = game.gameId;

    if (!currentGameId) {
      throw new Error("Game ID not found in response");
    }

    // Load the initial game state
    await loadGameState(currentGameId);

    showStatus(`Game created successfully!`, "success");
  } catch (error) {
    console.error("Error creating game:", error);
    showStatus(`Error creating game: ${error.message}`, "error");
  }
}

// Load game state (internal function)
async function loadGameState(gameId) {
  try {
    const response = await fetch(`${BASE_URL}/api/othello/${gameId}`);

    if (!response.ok) {
      throw new Error(`Failed to load game: ${response.statusText}`);
    }

    const gameState = await response.json();

    // Store valid moves
    validMoves = gameState.validMoves || [];

    // Update the UI with game state
    updateBoard(gameState.board);
    updateGameInfo(gameState);
  } catch (error) {
    console.error("Error loading game state:", error);
    showStatus(`Error loading game state: ${error.message}`, "error");
  }
}

// Make a move
async function makeMove(row, column) {
  if (!currentGameId) {
    showStatus("Please create a game first", "error");
    return;
  }

  const isValidMove = validMoves.some(
    (move) => move.x === row && move.y === column
  );

  if (!isValidMove) {
    showStatus("Invalid move! Please select a highlighted cell.", "error");
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/othello/${currentGameId}/move`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row: row,
          column: column,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `Failed to make move: ${response.statusText}`
      );
    }

    const gameState = await response.json();

    // Store valid moves
    validMoves = gameState.validMoves || [];

    // Update the UI with new game state
    updateBoard(gameState.board);
    updateGameInfo(gameState);

    showStatus(`Move made successfully!`, "success");
  } catch (error) {
    console.error("Error making move:", error);
    showStatus(`Error making move: ${error.message}`, "error");
  }
}

// Event Listeners
createGameBtn.addEventListener("click", () => {
  const player1Name = player1NameInput.value.trim() || "Player 1";
  const player2Name = player2NameInput.value.trim() || "Player 2";

  if (!player1Name || !player2Name) {
    showStatus("Please enter player names", "error");
    return;
  }

  createGame(player1Name, player2Name);
});

newGameBtn.addEventListener("click", startNewGame);

// Initialize the application
function init() {
  initializeBoard();
  showStatus("Ready to play Othello! Create a new game to start.", "info");

  // Test API connection (simplified)
  fetch(`${BASE_URL}/api/othello`)
    .then((response) => {
      if (response.ok) {
        showStatus("Connected to Othello API successfully!", "success");
      } else {
        showStatus("Othello API is available", "info");
      }
    })
    .catch((error) => {
      showStatus(`Cannot connect to Othello API: ${error.message}`, "error");
    });
}

// Start the application
document.addEventListener("DOMContentLoaded", init);
