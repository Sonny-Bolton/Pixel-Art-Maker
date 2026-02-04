const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const zoomCanvas = document.getElementById("zoomCanvas");
const zoomCtx = zoomCanvas.getContext("2d");

canvas.width = canvas.height = 512;
zoomCanvas.width = zoomCanvas.height = 128;

const colorPicker = document.getElementById("colorPicker");
const paletteEl = document.getElementById("palette");
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
const addFrameBtn = document.getElementById("addFrameBtn");
const frameSelect = document.getElementById("frameSelect");
const symX = document.getElementById("symX");
const symY = document.getElementById("symY");
const gridSnap = document.getElementById("gridSnap");
const darkMode = document.getElementById("darkMode");

let gridSize = 16;
let pixelSize;
let tool = "pen";
let color = "#000000";
let drawing = false;

let frames = [];
let currentFrame = 0;
let undoStack = [];
let redoStack = [];

const palette = ["#000000", "#ffffff", "#ef4444", "#22c55e", "#3b82f6"];

function newGrid() {
  return Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  );
}

function init() {
  frames = [newGrid()];
  currentFrame = 0;
  updateFrames();
  draw();
  buildPalette();
}

function buildPalette() {
  paletteEl.innerHTML = "";
  palette.forEach(c => {
    const d = document.createElement("div");
    d.style.background = c;
    d.onclick = () => color = c;
    paletteEl.appendChild(d);
  });
}

function updateFrames() {
  frameSelect.innerHTML = "";
  frames.forEach((_, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.text = `Frame ${i + 1}`;
    frameSelect.appendChild(o);
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pixelSize = canvas.width / gridSize;
  const grid = frames[currentFrame];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c]) {
        ctx.fillStyle = grid[r][c];
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
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (canvas.width / r.width);
  const y = (e.clientY - r.top) * (canvas.height / r.height);
  return {
    row: Math.floor(y / pixelSize),
    col: Math.floor(x / pixelSize)
  };
}

function paint(r, c) {
  const grid = frames[currentFrame];
  const paintColor = tool === "eraser" ? null : color;

  const coords = [[r, c]];
  if (symX.checked) coords.push([r, gridSize - c - 1]);
  if (symY.checked) coords.push([gridSize - r - 1, c]);

  coords.forEach(([rr, cc]) => {
    if (rr >= 0 && cc >= 0 && rr < gridSize && cc < gridSize) {
      grid[rr][cc] = paintColor;
    }
  });
}

canvas.onmousedown = e => {
  drawing = true;
  undoStack.push(JSON.stringify(frames));
  redoStack = [];
  const { row, col } = getCell(e);
  paint(row, col);
  draw();
};

canvas.onmousemove = e => {
  if (!drawing) return;
  const { row, col } = getCell(e);
  paint(row, col);
  draw();
};

canvas.onmouseup = () => drawing = false;
canvas.onmouseleave = () => drawing = false;

penTool.onclick = () => tool = "pen";
eraserTool.onclick = () => tool = "eraser";
fillTool.onclick = () => tool = "fill";
colorPicker.oninput = e => color = e.target.value;

gridSizeSelect.onchange = e => {
  gridSize = +e.target.value;
  frames[currentFrame] = newGrid();
  draw();
};

undoBtn.onclick = () => {
  if (undoStack.length) {
    redoStack.push(JSON.stringify(frames));
    frames = JSON.parse(undoStack.pop());
    draw();
  }
};

redoBtn.onclick = () => {
  if (redoStack.length) {
    undoStack.push(JSON.stringify(frames));
    frames = JSON.parse(redoStack.pop());
    draw();
  }
};

addFrameBtn.onclick = () => {
  frames.push(newGrid());
  currentFrame = frames.length - 1;
  updateFrames();
  draw();
};

frameSelect.onchange = e => {
  currentFrame = +e.target.value;
  draw();
};

saveBtn.onclick = () =>
  localStorage.setItem("pixel-art", JSON.stringify(frames));

loadBtn.onclick = () => {
  const data = localStorage.getItem("pixel-art");
  if (data) {
    frames = JSON.parse(data);
    updateFrames();
    draw();
  }
};

clearBtn.onclick = () => {
  if (confirm("Clear frame?")) {
    frames[currentFrame] = newGrid();
    draw();
  }
};

exportBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = "pixel-art.png";
  link.href = canvas.toDataURL();
  link.click();
};

darkMode.onchange = e =>
  document.body.classList.toggle("dark", e.target.checked);

init();
