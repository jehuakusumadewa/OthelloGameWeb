function createStars() {
  const starsContainer = document.getElementById("stars");
  const starCount = 200;

  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";

    const x = Math.random() * 100;
    const y = Math.random() * 100;

    const size = Math.random() * 3;

    const delay = Math.random() * 5;

    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${x}%`;
    star.style.top = `${y}%`;
    star.style.animationDelay = `${delay}s`;

    starsContainer.appendChild(star);
  }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelector(".loading").classList.add("hidden");
  }, 2000);
});

let scene, camera, renderer, controls;
let othelloBoard;
let fallingObjects = [];
let fallingDiscs = [];
let animationPhase = 0;
let boardColor = 0xf0d9b5;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000428);
  scene.fog = new THREE.Fog(0x000428, 50, 200);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 20);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  document.getElementById("container").appendChild(renderer.domElement);

  // Tambahkan kontrol orbit
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Tambahkan pencahayaan
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Tambahkan point light untuk efek dramatis
  const pointLight = new THREE.PointLight(0x4ecdc4, 1, 100);
  pointLight.position.set(0, 15, 0);
  scene.add(pointLight);

  // Buat "lantai" untuk papan mendarat
  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshPhongMaterial({
    color: 0x004e92,
    transparent: true,
    opacity: 0.3,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Mulai animasi jatuh
  startFallingAnimation();

  // Handle resize window
  window.addEventListener("resize", onWindowResize);

  // Kontrol interaktif
  document.getElementById("playButton").addEventListener("click", function () {
    window.location.href = "game.html";
  });

  document
    .getElementById("viewAnimation")
    .addEventListener("click", restartAnimation);

  // Setup color toggle
  document.querySelectorAll(".color-option").forEach((option) => {
    option.addEventListener("click", function () {
      const color = parseInt(this.getAttribute("data-color"));
      changeBoardColor(color);
    });
  });

  // Mulai animasi
  animate();
}

function createOthelloBoard() {
  const boardGroup = new THREE.Group();

  // Base board (transparan, karena kita akan menggunakan kotak-kotak individual)
  const boardGeometry = new THREE.BoxGeometry(14, 0.5, 14);
  const boardMaterial = new THREE.MeshPhongMaterial({
    color: 0x2e8b57,
    transparent: true,
    opacity: 0.3,
  });
  const board = new THREE.Mesh(boardGeometry, boardMaterial);
  board.position.y = 0.25;
  board.castShadow = true;
  board.receiveShadow = true;
  boardGroup.add(board);

  // Buat grid 8x8 dengan kotak-kotak individual
  const gridSize = 8;
  const cellSize = 1.6;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Gunakan satu warna untuk semua kotak
      const squareColor = boardColor;

      const squareGeometry = new THREE.BoxGeometry(
        cellSize - 0.1,
        0.3,
        cellSize - 0.1
      );
      const squareMaterial = new THREE.MeshPhongMaterial({
        color: squareColor,
        shininess: 70,
      });

      const square = new THREE.Mesh(squareGeometry, squareMaterial);
      const targetX = (col - 3.5) * cellSize;
      const targetZ = (row - 3.5) * cellSize;

      // Set posisi target
      square.userData.targetPosition = { x: targetX, y: 0.5, z: targetZ };
      square.userData.targetRotation = { x: 0, y: 0, z: 0 };

      // Posisi awal acak di atas
      const startX = targetX + (Math.random() - 0.5) * 30;
      const startZ = targetZ + (Math.random() - 0.5) * 30;
      const startY = 30 + Math.random() * 20;

      square.position.set(startX, startY, startZ);

      // Rotasi awal acak
      square.rotation.x = Math.random() * Math.PI;
      square.rotation.y = Math.random() * Math.PI;
      square.rotation.z = Math.random() * Math.PI;

      square.castShadow = true;
      square.receiveShadow = true;

      // Tambahkan user data untuk interaksi nanti
      square.userData.row = row;
      square.userData.col = col;
      square.userData.type = "square";
      square.userData.landed = false;
      square.userData.speed = 0.5 + Math.random() * 0.5;
      square.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.05,
        y: (Math.random() - 0.5) * 0.05,
        z: (Math.random() - 0.5) * 0.05,
      };

      boardGroup.add(square);
      fallingObjects.push(square);
    }
  }

  // Tambahkan border
  const borderGeometry = new THREE.BoxGeometry(15, 1, 15);
  const borderMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4513 });
  const border = new THREE.Mesh(borderGeometry, borderMaterial);
  border.position.y = 0;
  border.castShadow = true;
  boardGroup.add(border);

  scene.add(boardGroup);
  othelloBoard = boardGroup;
}

function createInitialDiscs() {
  const discGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 32);
  const discMaterialBlack = new THREE.MeshPhongMaterial({
    color: 0x000000,
  });
  const discMaterialWhite = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });

  const cellSize = 1.6;

  // Posisi awal 4 disc di tengah papan
  // Row pertama: hitam, putih
  // Row kedua: putih, hitam
  const discPositions = [
    { row: 3, col: 3, color: "black" }, // Hitam
    { row: 3, col: 4, color: "white" }, // Putih
    { row: 4, col: 3, color: "white" }, // Putih
    { row: 4, col: 4, color: "black" }, // Hitam
  ];

  discPositions.forEach((pos) => {
    const material =
      pos.color === "black" ? discMaterialBlack : discMaterialWhite;
    const disc = new THREE.Mesh(discGeometry, material);

    const targetX = (pos.col - 3.5) * cellSize;
    const targetZ = (pos.row - 3.5) * cellSize;

    // Set posisi target
    disc.userData.targetPosition = { x: targetX, y: 1.2, z: targetZ };
    disc.userData.targetRotation = { x: 0, y: 0, z: 0 };

    // Posisi awal acak di atas
    const startX = targetX + (Math.random() - 0.5) * 10;
    const startZ = targetZ + (Math.random() - 0.5) * 10;
    const startY = 20 + Math.random() * 10;

    disc.position.set(startX, startY, startZ);

    // Rotasi awal acak
    disc.rotation.x = Math.random() * Math.PI;
    disc.rotation.y = Math.random() * Math.PI;
    disc.rotation.z = Math.random() * Math.PI;

    disc.castShadow = true;
    disc.receiveShadow = true;

    // Tambahkan user data untuk interaksi nanti
    disc.userData.row = pos.row;
    disc.userData.col = pos.col;
    disc.userData.type = "disc";
    disc.userData.color = pos.color;
    disc.userData.landed = false;
    disc.userData.speed = 0.5 + Math.random() * 0.5;
    disc.userData.rotationSpeed = {
      x: (Math.random() - 0.5) * 0.05,
      y: (Math.random() - 0.5) * 0.05,
      z: (Math.random() - 0.5) * 0.05,
    };

    scene.add(disc);
    fallingDiscs.push(disc);
  });
}

function startFallingAnimation() {
  // Reset state
  fallingObjects = [];
  fallingDiscs = [];
  animationPhase = 0;

  // Reset pesan penyelesaian
  document.getElementById("completionMessage").style.opacity = 0;

  // Hapus board lama jika ada
  if (othelloBoard) {
    scene.remove(othelloBoard);
  }

  // Buat board baru
  createOthelloBoard();
  playSound();

  // Buat disc setelah board selesai
  setTimeout(() => {
    createInitialDiscs();
  }, 1000);
}

function animate() {
  requestAnimationFrame(animate);

  // Animasi jatuh
  if (animationPhase === 0) {
    let allLanded = true;

    fallingObjects.forEach((square) => {
      if (!square.userData.landed) {
        const targetPos = square.userData.targetPosition;
        const dx = targetPos.x - square.position.x;
        const dy = targetPos.y - square.position.y;
        const dz = targetPos.z - square.position.z;

        // Hitung jarak ke target
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > 0.1) {
          // Bergerak menuju target
          const speed = square.userData.speed * 0.05;
          square.position.x += dx * speed;
          square.position.y += dy * speed;
          square.position.z += dz * speed;

          // Rotasi saat jatuh
          square.rotation.x += square.userData.rotationSpeed.x;
          square.rotation.y += square.userData.rotationSpeed.y;
          square.rotation.z += square.userData.rotationSpeed.z;

          allLanded = false;
        } else {
          // Sudah mencapai target
          square.position.set(targetPos.x, targetPos.y, targetPos.z);
          square.userData.landed = true;

          // Efek bounce kecil
          square.position.y = targetPos.y + 0.1;
          setTimeout(() => {
            square.position.y = targetPos.y;
          }, 100);
        }
      }
    });

    // Animasi jatuh disc
    fallingDiscs.forEach((disc) => {
      if (!disc.userData.landed) {
        const targetPos = disc.userData.targetPosition;
        const dx = targetPos.x - disc.position.x;
        const dy = targetPos.y - disc.position.y;
        const dz = targetPos.z - disc.position.z;

        // Hitung jarak ke target
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > 0.1) {
          // Bergerak menuju target
          const speed = disc.userData.speed * 0.05;
          disc.position.x += dx * speed;
          disc.position.y += dy * speed;
          disc.position.z += dz * speed;

          // Rotasi saat jatuh
          disc.rotation.x += disc.userData.rotationSpeed.x;
          disc.rotation.y += disc.userData.rotationSpeed.y;
          disc.rotation.z += disc.userData.rotationSpeed.z;

          allLanded = false;
        } else {
          // Sudah mencapai target
          disc.position.set(targetPos.x, targetPos.y, targetPos.z);
          disc.userData.landed = true;

          // Efek bounce kecil
          disc.position.y = targetPos.y + 0.1;
          setTimeout(() => {
            disc.position.y = targetPos.y;
          }, 100);
        }
      }
    });

    if (allLanded && fallingDiscs.every((disc) => disc.userData.landed)) {
      animationPhase = 1;
      setTimeout(() => {
        animationPhase = 2;
        settleAnimation();
      }, 500);
    }
  }

  // Rotasi camera yang halus setelah mendarat
  if (animationPhase === 2 && othelloBoard) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
  }

  // Update kontrol
  controls.update();

  // Render scene
  renderer.render(scene, camera);
}

function settleAnimation() {
  // Animasi penyelesaian - semua kotak kembali ke posisi normal
  let completed = 0;
  const total = fallingObjects.length;

  fallingObjects.forEach((square) => {
    // Reset rotation untuk kotak
    const targetRotation = { x: 0, y: 0, z: 0 };
    const duration = 800 + Math.random() * 400;

    // Animate rotation
    animateRotation(square, targetRotation, duration, () => {
      completed++;
      if (completed === total) {
        // Tampilkan pesan penyelesaian
        document.getElementById("completionMessage").style.opacity = 1;
        setTimeout(() => {
          document.getElementById("completionMessage").style.opacity = 0;
        }, 2000);
      }
    });
  });

  // Juga animasi penyelesaian untuk disc
  fallingDiscs.forEach((disc) => {
    const targetRotation = { x: 0, y: 0, z: 0 };
    const duration = 800 + Math.random() * 400;

    animateRotation(disc, targetRotation, duration);
  });
}

function animateRotation(mesh, targetRotation, duration, onComplete) {
  const startRotation = {
    x: mesh.rotation.x,
    y: mesh.rotation.y,
    z: mesh.rotation.z,
  };

  const startTime = Date.now();

  function updateRotation() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    mesh.rotation.x =
      startRotation.x + (targetRotation.x - startRotation.x) * easeProgress;
    mesh.rotation.y =
      startRotation.y + (targetRotation.y - startRotation.y) * easeProgress;
    mesh.rotation.z =
      startRotation.z + (targetRotation.z - startRotation.z) * easeProgress;

    if (progress < 1) {
      requestAnimationFrame(updateRotation);
    } else if (onComplete) {
      onComplete();
    }
  }

  updateRotation();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function restartAnimation() {
  controls.autoRotate = false;

  // Hapus disc yang ada
  fallingDiscs.forEach((disc) => {
    scene.remove(disc);
  });

  startFallingAnimation();
}

function changeBoardColor(color) {
  boardColor = color;
  restartAnimation();
}
function playSound() {
    document.getElementById("idle-song").play();
}
// Inisialisasi aplikasi
init();
createStars();
