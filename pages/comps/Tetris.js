import React, { useEffect, useRef } from "react";
import styles from "../../styles/tetris.module.css";

const Tetris = () => {
  const canvasRef = useRef(null);
  // Tetromino shapes
  const tetrominos = [
    // I-piece
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    // J-piece
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    // L-piece
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    // O-piece
    [
      [1, 1],
      [1, 1],
    ],
    // S-piece
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    // T-piece
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    // Z-piece
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const gridSize = 20; // Size of each cell in pixels
      const gridWidth = canvas.width / gridSize; // Number of cells horizontally
      const gridHeight = canvas.height / gridSize; // Number of cells vertically

      // Game state variables
      let grid = createEmptyGrid(); // 2D array representing the game grid
      let currentPiece = null; // The current moving piece
      let nextPiece = createRandomPiece(); // The next piece to be spawned
      let score = 0; // Player's score
      let isGameOver = false; // Flag indicating if the game is over
      let isPaused = true; // Flag indicating if the game is paused
      let dropInterval = 2500; // Time interval for dropping pieces (in milliseconds)
      let lastDropTime = Date.now(); // Track the last drop time
      let dropTimer = null;
      // Game control elements
      const startButton = document.getElementById("start-button");
      const pauseButton = document.getElementById("pause-button");
      const scoreDisplay = document.getElementById("score-display");

      // Event listeners
      document.addEventListener("keydown", handleKeyDown);
      startButton.addEventListener("click", startGame);
      pauseButton.addEventListener("click", togglePause);

      // Helper functions
      function createEmptyGrid() {
        // Creates a 2D array representing an empty grid
        return Array.from({ length: gridHeight }, () =>
          Array.from({ length: gridWidth }, () => 0)
        );
      }

      function createRandomPiece() {
        // Creates a random piece object with its shape and rotation
        const randomPiece =
          tetrominos[Math.floor(Math.random() * tetrominos.length)];
        return {
          shape: randomPiece,
          rotation: 0,
          x: Math.floor(gridWidth / 2) - 1,
          y: 0,
        };
      }

      function drawGrid() {
        // Renders the game grid on the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < gridHeight; y++) {
          for (let x = 0; x < gridWidth; x++) {
            if (grid[y][x]) {
              ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
            }
          }
        }
      }

      function drawPiece(piece) {
        // Renders a piece on the canvas
        const { shape, rotation, x, y } = piece;
        const rotatedShape = rotateShape(shape, rotation);
        for (let row = 0; row < rotatedShape.length; row++) {
          for (let col = 0; col < rotatedShape[row].length; col++) {
            if (rotatedShape[row][col]) {
              ctx.fillRect(
                (x + col) * gridSize,
                (y + row) * gridSize,
                gridSize,
                gridSize
              );
            }
          }
        }
      }

      function movePiece(direction) {
        // Moves the current piece in the specified direction
        let newX = currentPiece.x;
        let newY = currentPiece.y;
        switch (direction) {
          case "left":
            newX--;
            break;
          case "right":
            newX++;
            break;
          case "down":
            newY++;
            break;
        }
        if (isValidPosition(currentPiece, newX, newY)) {
          currentPiece.x = newX;
          currentPiece.y = newY;
        }
      }

      function rotatePiece() {
        // Rotates the current piece
        const newRotation = (currentPiece.rotation + 1) % 4;
        const rotatedPiece = {
          ...currentPiece,
          rotation: newRotation,
        };
        if (isValidPosition(rotatedPiece, currentPiece.x, currentPiece.y)) {
          currentPiece.rotation = newRotation;
        }
      }

      function dropPiece() {
        // Drops the current piece one row down
        movePiece("down");
      }

      function isValidPosition(piece, gridX, gridY) {
        // Checks if a piece can be placed at a given position
        const { shape, rotation } = piece;
        const rotatedShape = rotateShape(shape, rotation);
        for (let row = 0; row < rotatedShape.length; row++) {
          for (let col = 0; col < rotatedShape[row].length; col++) {
            if (rotatedShape[row][col]) {
              const x = gridX + col;
              const y = gridY + row;
              if (
                x < 0 ||
                x >= gridWidth ||
                y >= gridHeight ||
                (y >= 0 && grid[y][x])
              ) {
                return false;
              }
            }
          }
        }
        return true;
      }

      function placePiece() {
        // Places the current piece on the grid
        const { shape, rotation, x, y } = currentPiece;
        const rotatedShape = rotateShape(shape, rotation);
        for (let row = 0; row < rotatedShape.length; row++) {
          for (let col = 0; col < rotatedShape[row].length; col++) {
            if (rotatedShape[row][col]) {
              grid[y + row][x + col] = 1;
            }
          }
        }
      }

      function clearLines() {
        // Checks for and removes any completed lines
        let linesCleared = 0;
        for (let y = gridHeight - 1; y >= 0; y--) {
          if (grid[y].every((cell) => cell !== 0)) {
            grid.splice(y, 1);
            grid.unshift(Array.from({ length: gridWidth }, () => 0));
            linesCleared++;
          }
        }
        updateScore(linesCleared);
      }

      function updateScore(linesCleared) {
        // Updates the score based on the number of lines cleared
        const scoreMultiplier = [0, 40, 100, 300, 1200];
        score += scoreMultiplier[linesCleared] || 0;
        scoreDisplay.textContent = `Score: ${score}`;
      }

      function rotateShape(shape, rotation) {
        // Rotates a shape matrix by the given rotation value
        const rotatedShape = [];
        for (let row = 0; row < shape[0].length; row++) {
          rotatedShape[row] = [];
          for (let col = 0; col < shape.length; col++) {
            rotatedShape[row][col] = shape[shape.length - 1 - col][row];
          }
        }
        return rotation === 0
          ? rotatedShape
          : rotateShape(rotatedShape, rotation - 1);
      }

      function handleKeyDown(event) {
        // Handles user input for moving/rotating the current piece
        if (!isPaused && !isGameOver) {
          console.log(event.code);
          switch (event.code) {
            case "ArrowLeft":
              movePiece("left");
              break;
            case "ArrowRight":
              movePiece("right");
              break;
            case "ArrowDown":
              movePiece("down");
              break;
            case "ArrowUp":
              rotatePiece();
              break;
          }
          // Redraw after movement
          drawGrid();
          drawPiece(currentPiece);
        }
      }

      function startGame() {
        // Initializes the game state and starts the game loop
        grid = createEmptyGrid();
        currentPiece = createRandomPiece();
        score = 0;
        isGameOver = false;
        isPaused = false;
        scoreDisplay.textContent = `Score: ${score}`;
        startButton.disabled = true;
        pauseButton.disabled = false;
        lastDropTime = Date.now(); // Initialize last drop time
        dropTimer = setInterval(gameLoop, 1000 / 60); // 60 FPS game loop
      }

      function togglePause() {
        // Pauses or resumes the game
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? "Resume" : "Pause";
        if (isPaused) {
          clearInterval(dropTimer);
        } else {
          dropTimer = setInterval(gameLoop, 1000 / 60); // 60 FPS game loop
        }
      }

      function gameOver() {
        // Handles game over
        clearInterval(dropTimer);
        isGameOver = true;
        startButton.disabled = false;
        pauseButton.disabled = true;
        console.log(`Game Over! Your score: ${score}`);
      }

      function gameLoop() {
        // The main game loop that handles rendering and updating the game state
        const currentTime = Date.now();
        const deltaTime = currentTime - lastDropTime;

        if (!isPaused && !isGameOver) {
          if (deltaTime > dropInterval) {
            dropPiece();
            lastDropTime = currentTime; // Reset drop time
          }

          drawGrid();
          drawPiece(currentPiece);

          if (
            !isValidPosition(currentPiece, currentPiece.x, currentPiece.y + 1)
          ) {
            placePiece();
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createRandomPiece();
            if (
              !isValidPosition(currentPiece, currentPiece.x, currentPiece.y)
            ) {
              gameOver();
            }
          }
        }
        requestAnimationFrame(gameLoop);
      }

      // Start the game loop
      gameLoop();
    }
  }, []);

  return (
    <div className={styles.tetrisBody}>
      <div id="game-container" className={styles.gameContainer}>
        <canvas
          id="game-canvas"
          className={styles.gameCanvas}
          width="640"
          height="400"
          ref={canvasRef}
        ></canvas>
        <div id="controls" className={styles.controls}>
          <div id="score-display" className={styles.scoreDisplay}>
            Score: 0
          </div>
          <button id="start-button">Start</button>
          <button id="pause-button" disabled>
            Pause
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tetris;
