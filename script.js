// Canvas and context
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const colorPicker = document.getElementById('colorPicker');
const penTool = document.getElementById('penTool');
const eraserTool = document.getElementById('eraserTool');
const gridSizeSelect = document.getElementById('gridSize');
const gridToggle = document.getElementById('gridToggle');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');

// State
let gridSize = 16;
let pixelSize = 0;
let currentColor = '#000000';
let isDrawing = false;
let isEraser = false;
let showGrid = true;
let pixels = []; // 2D array to store pixel colors

// Initialize the canvas
function initCanvas() {
    // Set canvas size (fixed at 512x512 for consistent quality)
    const canvasWidth = 512;
    const canvasHeight = 512;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Calculate pixel size based on grid
    pixelSize = canvasWidth / gridSize;
    
    // Initialize pixels array
    pixels = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    
    // Clear and draw initial state
    clearCanvas();
}

// Draw the entire canvas
function drawCanvas() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pixels
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (pixels[row][col]) {
                ctx.fillStyle = pixels[row][col];
                ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    // Draw grid lines if enabled
    if (showGrid) {
        drawGrid();
    }
}

// Draw grid lines
function drawGrid() {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelSize, 0);
        ctx.lineTo(i * pixelSize, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * pixelSize);
        ctx.lineTo(canvas.width, i * pixelSize);
        ctx.stroke();
    }
}

// Get grid coordinates from mouse position
function getGridCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const col = Math.floor(x / pixelSize);
    const row = Math.floor(y / pixelSize);
    
    return { row, col };
}

// Paint a pixel
function paintPixel(row, col) {
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        pixels[row][col] = isEraser ? null : currentColor;
        drawCanvas();
    }
}

// Clear the canvas
function clearCanvas() {
    pixels = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    drawCanvas();
}

// Export canvas as PNG
function exportCanvas() {
    // Create a temporary canvas without grid lines
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Draw only the pixels (no grid)
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (pixels[row][col]) {
                tempCtx.fillStyle = pixels[row][col];
                tempCtx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    // Convert to blob and download
    tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `pixel-art-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });
}

// Event Listeners

// Mouse events for drawing
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const { row, col } = getGridCoordinates(e);
    paintPixel(row, col);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        const { row, col } = getGridCoordinates(e);
        paintPixel(row, col);
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
    isDrawing = false;
});

// Right-click to erase (prevent context menu)
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const { row, col } = getGridCoordinates(e);
    pixels[row][col] = null;
    drawCanvas();
});

// Touch events for mobile support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDrawing = true;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDrawing) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isDrawing = false;
});

// Color picker
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    if (isEraser) {
        // Switch back to pen when color is changed
        isEraser = false;
        penTool.classList.add('active');
        eraserTool.classList.remove('active');
    }
});

// Tool selection
penTool.addEventListener('click', () => {
    isEraser = false;
    penTool.classList.add('active');
    eraserTool.classList.remove('active');
});

eraserTool.addEventListener('click', () => {
    isEraser = true;
    eraserTool.classList.add('active');
    penTool.classList.remove('active');
});

// Grid size change
gridSizeSelect.addEventListener('change', (e) => {
    gridSize = parseInt(e.target.value);
    initCanvas();
});

// Grid toggle
gridToggle.addEventListener('change', (e) => {
    showGrid = e.target.checked;
    drawCanvas();
});

// Clear button
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
        clearCanvas();
    }
});

//Export button
exportBtn.addEventListener('click', exportCanvas);

//Initialize on load
initCanvas();