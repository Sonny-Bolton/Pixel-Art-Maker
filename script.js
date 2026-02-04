const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const zoomCanvas = document.getElementById("zoomCanvas");
const zoomCtx = zoomCanvas.getContext("2d");

canvas.width = canvas.height = 512;
zoomCanvas.width = zoomCanvas.height = 128;

const colorPicker = document.getElementById("colorPicker");
const penTool = document.getElementById("penTool");
const eraserTool = document.getElementById("eraserTool");
const fillTool = document.getElementById("fillTool");
const gridSizeSelect = document.getElementById("gridSize");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");

let gridSize = 16;
let pixelSize = canvas.width / gridSize;
let pixels = [];
let tool = "pen";
let color = "#000000";
let drawing = false;

let undoStack = [];
let redoStack = [];

function init() {
  pixels = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
  pixelSize = canvas.width / gridSize;
  saveState();
  draw();
}

function saveState() {
  undoStack.push(JSON.stringify(pixels));
  redoStack = [];
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (pixels[r][c]) {
        ctx.fillStyle = pixels[r][c];
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
      }
    }
  }

  ctx.strokeStyle = "#e5e7eb";
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * pixelSize, 0);
    ctx.lineTo(i * pixelSize, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * pixelSize);
    ctx.lineTo(canvas.width, i * pixelSize);
    ctx.stroke();
  }
}

function getCell(e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  return {
    row: Math.floor(y / pixelSize),
    col: Math.floor(x / pixelSize)
  };
}

function floodFill(r, c, target, replacement) {
  if (target === replacement) return;
  if (r < 0 || c < 0 || r >= gridSize || c >= gridSize) return;
  if (pixels[r][c] !== target) return;

  pixels[r][c] = replacement;
  floodFill(r + 1, c, target, replacement);
  floodFill(r - 1, c, target, replacement);
  floodFill(r, c + 1, target, replacement);
  floodFill(r, c - 1, target, replacement);
}

canvas.addEventListener("mousedown", e => {
  drawing = true;
  saveState();
  const { row, col } = getCell(e);

  if (tool === "fill") {
    floodFill(row, col, pixels[row][col], color);
  } else {
    pixels[row][col] = tool === "eraser" ? null : color;
  }
  draw();
});

canvas.addEventListener("mousemove", e => {
  if (!drawing) return;
  const { row, col } = getCell(e);
  if (tool === "pen") pixels[row][col] = color;
  if (tool === "eraser") pixels[row][col] = null;
  draw();
  drawZoom(row, col);
});

canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseleave", () => drawing = false);

function drawZoom(r, c) {
  zoomCtx.imageSmoothingEnabled = false;
  zoomCtx.clearRect(0, 0, 128, 128);
  zoomCtx.drawImage(
    canvas,
    c * pixelSize - pixelSize,
    r * pixelSize - pixelSize,
    pixelSize * 3,
    pixelSize * 3,
    0,
    0,
    128,
    128
  );
}

penTool.onclick = () => tool = "pen";
eraserTool.onclick = () => tool = "eraser";
fillTool.onclick = () => tool = "fill";

colorPicker.oninput = e => color = e.target.value;

gridSizeSelect.onchange = e => {
  gridSize = +e.target.value;
  init();
};

undoBtn.onclick = () => {
  if (undoStack.length > 1) {
    redoStack.push(undoStack.pop());
    pixels = JSON.parse(undoStack[undoStack.length - 1]);
    draw();
  }
};

redoBtn.onclick = () => {
  if (redoStack.length) {
    const state = redoStack.pop();
    undoStack.push(state);
    pixels = JSON.parse(state);
    draw();
  }
};

saveBtn.onclick = () =>
  localStorage.setItem("pixelArt", JSON.stringify(pixels));

loadBtn.onclick = () => {
  const data = localStorage.getItem("pixelArt");
  if (data) {
    pixels = JSON.parse(data);
    draw();
  }
};

clearBtn.onclick = () => {
  if (confirm("Clear canvas?")) init();
};

exportBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = canvas.toDataURL();
  link.click();
};

init();
