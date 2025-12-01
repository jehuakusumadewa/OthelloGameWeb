document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing Othello Game...");
  initializeGame();
});

let currentGameId = null;
const API_BASE_URL = "http://localhost:5242/api";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}

function showToast(message, type = "error") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    background: ${
      type === "success"
        ? "#51cf66"
        : type === "warning"
        ? "#fcc419"
        : "#ff6b6b"
    };
    color: ${type === "warning" ? "#000" : "#fff"};
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
    font-weight: 500;
  `;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  }, 10);

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

async function handleCellClick(row, col) {
  if (!currentGameId) {
    showToast("Game tidak ditemukan. Buat game baru.", "error");
    return;
  }

  console.log("Making move at:", row, col);

  try {
    showLoading(true);

    const response = await fetch(
      `${API_BASE_URL}/Othello/${currentGameId}/move`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          row: row,
          column: col,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        let errorMsg = "Invalid move";
        try {
          const errorResult = await response.json();
          errorMsg = errorResult.error || errorResult.errorMessage || errorMsg;
        } catch {
          errorMsg = (await response.text()) || errorMsg;
        }

        console.log("Invalid move detected:", errorMsg);
        showInvalidMoveFeedback(row, col, errorMsg);
        return;
      } else {
        throw new Error(
          `Server error: ${response.status} - ${response.statusText}`
        );
      }
    }

    const result = await response.json();

    let gameData;
    if (result.value) {
      gameData = result.value;
    } else if (result.board) {
      gameData = result;
    } else {
      console.error("Unexpected response format:", result);
      showToast("Format respons tidak dikenali", "error");
      return;
    }

    // showToast("Langkah berhasil!", "success");
    renderGameState(gameData);
  } catch (error) {
    console.error("Fatal error making move:", error);
    showToast("Gagal terhubung ke server. Periksa koneksi.", "error");
  } finally {
    showLoading(false);
  }
}

function showInvalidMoveFeedback(row, col, errorMessage) {
  const currentPlayerElement = document.getElementById(
    "current_player_display"
  );
  const currentPlayerName = currentPlayerElement
    ? currentPlayerElement.textContent
    : "Pemain";

  const errorMappings = {
    "Invalid move": `${currentPlayerName}, itu bukan langkah yang valid!`,
    "Not your turn": `${currentPlayerName}, tunggu giliranmu!`,
    "Game not found": "Game tidak ditemukan.",
    "Game is not active": "Game sudah selesai!",
    "Invalid position": `Posisi tidak valid.`,
    "Position occupied": `${currentPlayerName}, spot itu sudah diisi!`,
  };

  const friendlyMessage =
    errorMappings[errorMessage] ||
    `${currentPlayerName}, ${errorMessage.toLowerCase()}`;

  showToast(friendlyMessage, "warning");
  animateInvalidCell(row, col);
}

function animateInvalidCell(row, col) {
  const cells = document.querySelectorAll(".cell");
  const targetCell = Array.from(cells).find(
    (cell) =>
      parseInt(cell.dataset.row) === row && parseInt(cell.dataset.col) === col
  );

  if (targetCell) {
    targetCell.classList.add("invalid-shake");
    setTimeout(() => {
      targetCell.classList.remove("invalid-shake");
    }, 600);
  }
}

async function initializeGame() {
  createBoardGrid();
  setupEventListeners();
  showPlayerModal();
  console.log("Othello Game initialized successfully!");
}

function showPlayerModal() {
  const modal = document.getElementById("player_modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => {
      const disks = document.querySelectorAll("#player_modal .disk");
      disks.forEach((disk, index) => {
        disk.style.opacity = "0";
        disk.style.transform = "scale(0) rotateY(0deg)";
        setTimeout(() => {
          disk.style.transition = "all 0.5s ease";
          disk.style.opacity = "1";
          disk.style.transform = "scale(1) rotateY(0deg)";
        }, 300 + index * 100);
      });
    }, 100);
  }
}

function hidePlayerModal() {
  const modal = document.getElementById("player_modal");
  if (modal) {
    modal.style.display = "none";
  }
}

function showGameMain() {
  const gameMain = document.getElementById("game_main");
  if (gameMain) {
    gameMain.style.display = "flex";
  }
}

function hideGameMain() {
  const gameMain = document.getElementById("game_main");
  if (gameMain) {
    gameMain.style.display = "none";
  }
}

async function createNewGame(player1Name, player2Name) {
  try {
    showLoading(true);
    console.log("Creating new game with:", player1Name, player2Name);

    if (!player1Name.trim() || !player2Name.trim()) {
      showToast("Nama pemain tidak boleh kosong", "error");
      return;
    }

    localStorage.setItem("player1Name", player1Name);
    localStorage.setItem("player2Name", player2Name);

    const response = await fetch(`${API_BASE_URL}/Othello`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        player1Name: player1Name,
        player2Name: player2Name,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Gagal membuat game";
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (!result.gameId) {
      throw new Error("Game ID tidak diterima dari server");
    }

    currentGameId = result.gameId;
    console.log("Game created with ID:", currentGameId);

    document.getElementById("black_player_name").textContent = player1Name;
    document.getElementById("white_player_name").textContent = player2Name;

    hidePlayerModal();
    showGameMain();
    await updateGameState();
    showToast("Game berhasil dibuat!", "success");
  } catch (error) {
    console.error("Error creating game:", error);
    showToast(`Gagal membuat game: ${error.message}`, "error");
    const blackName = document.getElementById("black_player_name");
    const whiteName = document.getElementById("white_player_name");
    if (blackName && whiteName) {
      blackName.textContent = player1Name;
      whiteName.textContent = player2Name;
    }
    hidePlayerModal();
    showGameMain();
  } finally {
    showLoading(false);
  }
}

async function updateGameState() {
  if (!currentGameId) {
    showToast("Game tidak aktif. Buat game baru.", "error");
    return;
  }

  try {
    showLoading(true);
    console.log("Fetching game state for:", currentGameId);

    const response = await fetch(`${API_BASE_URL}/Othello/${currentGameId}`);

    if (response.status === 404) {
      showToast("Game tidak ditemukan. Buat game baru.", "error");
      currentGameId = null;
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const gameState = await response.json();
    console.log("Game state received:", gameState);
    renderGameState(gameState);
  } catch (error) {
    console.error("Error fetching game state:", error);
    if (error.message.includes("404") || error.message.includes("not found")) {
      showToast("Game tidak ditemukan. Buat game baru.", "error");
      currentGameId = null;
    } else {
      showToast("Gagal memuat game state", "error");
    }
  } finally {
    showLoading(false);
  }
}

function renderGameState(gameState) {
  console.log("Rendering game state:", gameState);

  let state = gameState;
  if (gameState && gameState.value) {
    state = gameState.value;
  }

  if (!state) {
    console.error("Invalid game state received");
    return;
  }

  const blackScore = document.getElementById("black_score");
  const whiteScore = document.getElementById("white_score");
  if (blackScore && whiteScore) {
    blackScore.textContent = state.blackScore || 2;
    whiteScore.textContent = state.whiteScore || 2;
  }

  const currentPlayerElement = document.getElementById(
    "current_player_display"
  );
  if (currentPlayerElement && state.currentPlayerColor !== undefined) {
    let colorClass = "black";

    if (
      state.currentPlayerColor === 0 ||
      state.currentPlayerColor === "White"
    ) {
      colorClass = "white";
    } else if (
      state.currentPlayerColor === 1 ||
      state.currentPlayerColor === "Black"
    ) {
      colorClass = "black";
    }

    const player1Name =
      document.getElementById("black_player_name").textContent;
    const player2Name =
      document.getElementById("white_player_name").textContent;

    const displayName = colorClass === "black" ? player1Name : player2Name;

    currentPlayerElement.textContent = displayName;
    currentPlayerElement.className = `player-display ${colorClass}`;
  }

  updateActivePlayer(state.currentPlayerColor);

  const statusElement = document.getElementById("game_status_display");
  if (statusElement) {
    const status = state.status;
    const player1Name =
      document.getElementById("black_player_name").textContent;
    const player2Name =
      document.getElementById("white_player_name").textContent;

    if (status === 0 || status === "NotStart") {
      statusElement.textContent = "Game not started";
    } else if (status === 1 || status === "Play") {
      const currentPlayerName =
        state.currentPlayerColor === 1 ? player1Name : player2Name;
      statusElement.textContent = `Current turn: ${currentPlayerName}`;
    } else if (status === 2 || status === "Win") {
      let winnerName = state.winner || "Unknown";
      if (winnerName === "Player1") winnerName = player1Name;
      if (winnerName === "Player2") winnerName = player2Name;
      statusElement.textContent = `Game Over! ${winnerName} wins!`;
    } else if (status === 3 || status === "Draw") {
      statusElement.textContent = "Game Over! It's a draw!";
    } else {
      statusElement.textContent = "Game in progress";
    }
  }

  renderBoard(state.board);
  renderValidMoves(state.validMoves);

  if (
    state.status === 1 &&
    (!state.validMoves || state.validMoves.length === 0)
  ) {
    const currentPlayerElement = document.getElementById(
      "current_player_display"
    );
    const currentPlayerName = currentPlayerElement
      ? currentPlayerElement.textContent
      : "Current player";
    showToast(
      `⏭ ${currentPlayerName} tidak ada langkah valid, giliran dilewati!`,
      "warning"
    );
  }

  if (
    state.status === 2 ||
    state.status === 3 ||
    state.status === "Win" ||
    state.status === "Draw"
  ) {
    showWinner(state);
  } else {
    hideWinner();
  }
}

function renderBoard(board) {
  const discsLayer = document.getElementById("discs_layer");
  if (!discsLayer) return;

  discsLayer.innerHTML = "";

  if (!board) {
    console.warn("No board data received");
    return;
  }

  console.log("Rendering board:", board);

  board.forEach((row) => {
    row.forEach((cell) => {
      if (
        cell.diskColor !== undefined &&
        cell.diskColor !== null &&
        cell.diskColor !== 2
      ) {
        const color = cell.diskColor === 0 ? "white" : "black";
        createDiscElement(cell.row, cell.column, color);
      }
    });
  });
}

function renderValidMoves(validMoves) {
  const validMoveLayer = document.getElementById("valid_move_layer");
  if (!validMoveLayer) return;

  validMoveLayer.innerHTML = "";

  if (!validMoves) {
    console.warn("No valid moves data received");
    return;
  }

  console.log("Rendering valid moves:", validMoves);

  validMoves.forEach((move) => {
    createValidMoveIndicator(move.x, move.y);
  });
}

function createDiscElement(row, col, color) {
  const discsLayer = document.getElementById("discs_layer");
  if (!discsLayer) return null;

  const disc = document.createElement("div");
  disc.className = `disc ${color}`;
  disc.dataset.row = row;
  disc.dataset.col = col;

  const cellSize = 100 / 8;
  disc.style.width = `${cellSize * 0.85}%`;
  disc.style.height = `${cellSize * 0.85}%`;
  disc.style.top = `${row * cellSize + cellSize * 0.075}%`;
  disc.style.left = `${col * cellSize + cellSize * 0.075}%`;

  discsLayer.appendChild(disc);
  return disc;
}

function createValidMoveIndicator(row, col) {
  const validMoveLayer = document.getElementById("valid_move_layer");
  if (!validMoveLayer) return null;

  const indicator = document.createElement("div");
  indicator.className = "valid-move";
  indicator.dataset.row = row;
  indicator.dataset.col = col;

  const cellSize = 100 / 8;
  indicator.style.top = `${row * cellSize + cellSize / 2}%`;
  indicator.style.left = `${col * cellSize + cellSize / 2}%`;
  indicator.style.transform = "translate(-50%, -50%)";

  indicator.addEventListener("click", () => handleCellClick(row, col));

  validMoveLayer.appendChild(indicator);
  return indicator;
}

function createBoardGrid() {
  const boardLayer = document.getElementById("game_board_layer");
  if (!boardLayer) return;

  boardLayer.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      boardLayer.appendChild(cell);
    }
  }
  console.log("Board grid created: 8x8");
}

function setupEventListeners() {
  const createBtn = document.getElementById("create_game_btn");
  if (createBtn) {
    createBtn.addEventListener("click", function () {
      const player1Name =
        document.getElementById("player1_name").value || "Player 1";
      const player2Name =
        document.getElementById("player2_name").value || "Player 2";
      createNewGame(player1Name, player2Name);
    });
  }

  const backBtn = document.getElementById("back_to_home");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      window.location.href = "index.html";
    });
  }

  const player1Input = document.getElementById("player1_name");
  const player2Input = document.getElementById("player2_name");

  if (player1Input) {
    player1Input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        document.getElementById("create_game_btn").click();
      }
    });
  }

  if (player2Input) {
    player2Input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        document.getElementById("create_game_btn").click();
      }
    });
  }

  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("cell")) {
      const row = parseInt(event.target.dataset.row);
      const col = parseInt(event.target.dataset.col);
      if (isValidMovePosition(row, col)) {
        handleCellClick(row, col);
      }
    }
  });

  const restartBtn = document.getElementById("restart_button");
  if (restartBtn) {
    restartBtn.addEventListener("click", async function () {
      if (confirm("Are you sure you want to restart the current game?")) {
        await restartGame();
      }
    });
  }

  const newGameBtn = document.getElementById("new_game_button");
  if (newGameBtn) {
    newGameBtn.addEventListener("click", function () {
      if (
        confirm(
          "Are you sure you want to create a new game? Current game will be lost."
        )
      ) {
        showPlayerModal();
        hideGameMain();
      }
    });
  }

  const newGameWinnerBtn = document.getElementById("newGameBtn");
  if (newGameWinnerBtn) {
    newGameWinnerBtn.addEventListener("click", function () {
      showPlayerModal();
      hideWinner();
    });
  }

  const minigrid = document.querySelector("#player_modal .minigrid");
  if (minigrid) {
    minigrid.addEventListener("mouseenter", () => {
      const disks = document.querySelectorAll("#player_modal .disk");
      disks.forEach((disk) => {
        disk.style.animationPlayState = "paused";
      });
    });

    minigrid.addEventListener("mouseleave", () => {
      const disks = document.querySelectorAll("#player_modal .disk");
      disks.forEach((disk) => {
        disk.style.animationPlayState = "running";
      });
    });
  }

  console.log("All event listeners setup");
}

function isValidMovePosition(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

async function restartGame() {
  if (!currentGameId) return;

  try {
    showLoading(true);
    const player1Name =
      document.getElementById("black_player_name").textContent;
    const player2Name =
      document.getElementById("white_player_name").textContent;

    await createNewGame(player1Name, player2Name);
  } catch (error) {
    console.error("Error restarting game:", error);
    showToast("❌ Error restarting game", "error");
  } finally {
    showLoading(false);
  }
}

function showWinner(gameState) {
  const winnerSection = document.getElementById("winnerSection");
  const winnerMessage = document.getElementById("winnerMessage");
  const finalBlackScore = document.getElementById("finalBlackScore");
  const finalWhiteScore = document.getElementById("finalWhiteScore");

  if (
    !winnerSection ||
    !winnerMessage ||
    !finalBlackScore ||
    !finalWhiteScore
  ) {
    return;
  }

  const player1Name = document.getElementById("black_player_name").textContent;
  const player2Name = document.getElementById("white_player_name").textContent;

  let message = "";

  if (gameState.status === 3 || gameState.status === "Draw") {
    message = "It's a Draw! 🤝";
  } else {
    let winnerName = gameState.winner || "Unknown";
    if (winnerName === "Player1") winnerName = player1Name;
    if (winnerName === "Player2") winnerName = player2Name;
    message = `🎊 ${winnerName} Wins! 🎊`;
  }

  winnerMessage.textContent = message;
  finalBlackScore.textContent = gameState.blackScore || 0;
  finalWhiteScore.textContent = gameState.whiteScore || 0;

  winnerSection.classList.remove("hidden");

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.style.pointerEvents = "none";
  });

  const validMoves = document.querySelectorAll(".valid-move");
  validMoves.forEach((move) => {
    move.style.pointerEvents = "none";
  });
}

function hideWinner() {
  const winnerSection = document.getElementById("winnerSection");
  if (winnerSection) {
    winnerSection.classList.add("hidden");
  }

  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.style.pointerEvents = "auto";
  });
}

function updateActivePlayer(currentPlayerColor) {
  const blackContainer = document.getElementById("black_player_container");
  const whiteContainer = document.getElementById("white_player_container");

  if (!blackContainer || !whiteContainer) {
    console.warn("Player containers not found");
    return;
  }

  blackContainer.classList.remove("active");
  whiteContainer.classList.remove("active");

  if (currentPlayerColor === 1 || currentPlayerColor === "Black") {
    blackContainer.classList.add("active");
  } else if (currentPlayerColor === 0 || currentPlayerColor === "White") {
    whiteContainer.classList.add("active");
  }
}

function showLoading(isLoading) {
  const board = document.getElementById("othello_game_container");
  if (board) {
    if (isLoading) {
      board.classList.add("loading");
    } else {
      board.classList.remove("loading");
    }
  }
}

setTimeout(() => {
  if (!currentGameId) {
    console.log("Backend connection check...");
  }
}, 5000);
