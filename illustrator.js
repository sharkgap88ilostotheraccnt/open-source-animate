let canvas, ctx;
let tool = "select";
let drawing = false;
let startX, startY;
let currentLine = null;
let objects = []; // stores drawn lines, text, etc.
let selectedObject = null;

window.onload = () => {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  document.getElementById("selectTool").onclick = () => setTool("select");
  document.getElementById("lineTool").onclick = () => setTool("line");
  document.getElementById("brushTool").onclick = () => setTool("brush");
  document.getElementById("eraserTool").onclick = () => setTool("eraser");
  document.getElementById("textTool").onclick = () => setTool("text");

  canvas.onmousedown = handleMouseDown;
  canvas.onmousemove = handleMouseMove;
  canvas.onmouseup = handleMouseUp;
};

function setTool(name) {
  tool = name;
  console.log("Tool set to", tool);
}

// Mouse events
function handleMouseDown(e) {
  const { x, y } = getMousePos(e);

  drawing = true;
  startX = x;
  startY = y;

  if (tool === "select") {
    selectedObject = objects.find(obj =>
      x >= obj.x && x <= obj.x2 && y >= obj.y && y <= obj.y2
    );
  }
  else if (tool === "line") {
    currentLine = { type: "line", x, y, x2: x, y2: y, color: "black" };
    objects.push(currentLine);
  }
  else if (tool === "brush") {
    currentLine = { type: "brush", points: [{ x, y }], color: "black" };
    objects.push(currentLine);
  }
  else if (tool === "eraser") {
    objects = objects.filter(obj => {
      if (obj.type === "line")
        return !(x >= obj.x && x <= obj.x2 && y >= obj.y && y <= obj.y2);
      if (obj.type === "brush")
        return !obj.points.some(p => Math.abs(p.x - x) < 5 && Math.abs(p.y - y) < 5);
      return true;
    });
    redraw();
  }
  else if (tool === "text") {
    const text = prompt("Enter text:");
    if (text) {
      const textObj = { type: "text", x, y, text, color: "black" };
      objects.push(textObj);
      redraw();
    }
  }
}

function handleMouseMove(e) {
  if (!drawing) return;
  const x = e.offsetX, y = e.offsetY;

  if (tool === "line" && currentLine) {
    currentLine.x2 = x;
    currentLine.y2 = y;
    redraw();
  }
  else if (tool === "brush" && currentLine) {
    currentLine.points.push({ x, y });
    redraw();
  }
  else if (tool === "select" && selectedObject) {
    const dx = x - startX;
    const dy = y - startY;
    selectedObject.x += dx;
    selectedObject.y += dy;
    if (selectedObject.x2 !== undefined) {
      selectedObject.x2 += dx;
      selectedObject.y2 += dy;
    }
    startX = x;
    startY = y;
    redraw();
  }
}

function handleMouseUp() {
  drawing = false;
  currentLine = null;
  selectedObject = null;
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const obj of objects) {
    ctx.strokeStyle = obj.color || "black";
    ctx.fillStyle = obj.color || "black";

    if (obj.type === "line") {
      ctx.beginPath();
      ctx.moveTo(obj.x, obj.y);
      ctx.lineTo(obj.x2, obj.y2);
      ctx.stroke();
    }
    else if (obj.type === "brush") {
      ctx.beginPath();
      ctx.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) {
        ctx.lineTo(obj.points[i].x, obj.points[i].y);
      }
      ctx.stroke();
    }
    else if (obj.type === "text") {
      ctx.font = "16px Arial";
      ctx.fillText(obj.text, obj.x, obj.y);
    }
  }
}
