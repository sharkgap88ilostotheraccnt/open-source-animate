const canvas = document.getElementById("illustratorCanvas");
const ctx = canvas.getContext("2d");

let tool = "select";
let shapes = [];
let currentShape = null;
let selectedShape = null;
let isDrawing = false;

// Tool buttons
document.getElementById("selectTool").onclick = () => tool = "select";
document.getElementById("lineTool").onclick = () => tool = "line";
document.getElementById("brushTool").onclick = () => tool = "brush";
document.getElementById("textTool").onclick = () => tool = "text";
document.getElementById("eraserTool").onclick = () => tool = "eraser";

canvas.addEventListener("mousedown", (e) => {
    const {offsetX: x, offsetY: y} = e;
    isDrawing = true;

    if (tool === "select") {
        selectedShape = shapes.find(s => isPointInShape(x, y, s));
    } 
    else if (tool === "line") {
        currentShape = { type: "line", x1: x, y1: y, x2: x, y2: y, color: "#fff" };
        shapes.push(currentShape);
    } 
    else if (tool === "brush") {
        currentShape = { type: "path", points: [{x, y}], color: "#fff" };
        shapes.push(currentShape);
    }
    else if (tool === "text") {
        const text = prompt("Enter text:");
        if (text) {
            shapes.push({ type: "text", x, y, text, color: "#fff" });
        }
        isDrawing = false;
    }
    else if (tool === "eraser") {
        const target = shapes.find(s => isPointInShape(x, y, s));
        if (target) shapes = shapes.filter(s => s !== target);
        isDrawing = false;
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    const {offsetX: x, offsetY: y} = e;

    if (tool === "line" && currentShape) {
        currentShape.x2 = x;
        currentShape.y2 = y;
    }
    else if (tool === "brush" && currentShape) {
        currentShape.points.push({x, y});
    }
    else if (tool === "select" && selectedShape) {
        const dx = x - selectedShape.x1;
        const dy = y - selectedShape.y1;
        moveShape(selectedShape, dx, dy);
    }

    draw();
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    currentShape = null;
});

// Utility: check if point is inside shape
function isPointInShape(x, y, shape) {
    if (shape.type === "line") {
        const buffer = 5;
        return (
            x >= Math.min(shape.x1, shape.x2) - buffer &&
            x <= Math.max(shape.x1, shape.x2) + buffer &&
            y >= Math.min(shape.y1, shape.y2) - buffer &&
            y <= Math.max(shape.y1, shape.y2) + buffer
        );
    }
    if (shape.type === "text") {
        ctx.font = "16px sans-serif";
        const width = ctx.measureText(shape.text).width;
        return x >= shape.x && x <= shape.x + width && y >= shape.y - 16 && y <= shape.y;
    }
    if (shape.type === "path") {
        return shape.points.some(p => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5);
    }
    return false;
}

// Move shapes
function moveShape(shape, dx, dy) {
    if (shape.type === "line") {
        shape.x1 += dx;
        shape.y1 += dy;
        shape.x2 += dx;
        shape.y2 += dy;
    }
    if (shape.type === "text") {
        shape.x += dx;
        shape.y += dy;
    }
    if (shape.type === "path") {
        shape.points.forEach(p => { p.x += dx; p.y += dy; });
    }
}

// Draw all shapes
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes.forEach(shape => {
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;
        ctx.lineWidth = 2;

        if (shape.type === "line") {
            ctx.beginPath();
            ctx.moveTo(shape.x1, shape.y1);
            ctx.lineTo(shape.x2, shape.y2);
            ctx.stroke();
        }
        if (shape.type === "text") {
            ctx.font = "16px sans-serif";
            ctx.fillText(shape.text, shape.x, shape.y);
        }
        if (shape.type === "path") {
            ctx.beginPath();
            shape.points.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        }

        // Highlight selected shape
        if (shape === selectedShape) {
            ctx.strokeStyle = "yellow";
            if (shape.type === "line") {
                ctx.strokeRect(Math.min(shape.x1, shape.x2), Math.min(shape.y1, shape.y2),
                               Math.abs(shape.x2 - shape.x1), Math.abs(shape.y2 - shape.y1));
            }
        }
    });
}

draw();

