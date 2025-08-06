const canvas = document.getElementById("illustratorCanvas");
const ctx = canvas.getContext("2d");

let tool = "brush";
let drawing = false;
let currentPath = [];
let paths = []; // stores drawn elements
let selectedPath = null;
let draggingPoint = null;

const color = "#000";
const lineWidth = 2;

// Tools mapping
const tools = ["brush", "eraser", "line", "select", "text"];
document.querySelectorAll(".toolbar button").forEach((btn, index) => {
  btn.addEventListener("click", () => {
    tool = tools[index];
    deselectAll();
    draw();
  });
});

canvas.addEventListener("mousedown", (e) => {
  const { x, y } = getMousePos(e);

  if (tool === "brush") {
    drawing = true;
    currentPath = [{ x, y }];
  } 
  else if (tool === "line") {
    drawing = true;
    currentPath = [{ x, y }, { x, y }];
  } 
  else if (tool === "eraser") {
    const hit = findPathNear(x, y);
    if (hit) {
      paths = paths.filter(p => p !== hit);
      draw();
    }
  }
  else if (tool === "select") {
    selectedPath = findPathNear(x, y);
    if (selectedPath) {
      selectedPath.selected = true;
      draggingPoint = findPointInPath(selectedPath, x, y);
    }
    draw();
  }
  else if (tool === "text") {
    const text = prompt("Enter text:");
    if (text) {
      paths.push({
        type: "text",
        text,
        x,
        y,
        color,
        selected: false
      });
      draw();
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const { x, y } = getMousePos(e);

  if (!drawing && draggingPoint === null) return;

  if (tool === "brush") {
    currentPath.push({ x, y });
    draw();
  } 
  else if (tool === "line") {
    currentPath[1] = { x, y };
    draw();
  } 
  else if (tool === "select" && selectedPath && draggingPoint !== null) {
    selectedPath.points[draggingPoint] = { x, y };
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  if (drawing) {
    if (currentPath.length > 0) {
      paths.push({
        type: tool === "line" ? "line" : "brush",
        points: [...currentPath],
        color,
        selected: false
      });
    }
    currentPath = [];
    drawing = false;
  }
  draggingPoint = null;
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paths.forEach((path) => {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = path.color;

    if (path.type === "brush") {
      ctx.beginPath();
      path.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    } 
    else if (path.type === "line") {
      const [p1, p2] = path.points;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    else if (path.type === "text") {
      ctx.fillStyle = path.color;
      ctx.font = "16px Arial";
      ctx.fillText(path.text, path.x, path.y);
    }

    if (path.selected && path.points) {
      drawHandles(path.points);
    }
  });

  // Show current drawing
  if (currentPath.length > 0 && (tool === "brush" || tool === "line")) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.beginPath();

    if (tool === "brush") {
      currentPath.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
    } else if (tool === "line") {
      const [p1, p2] = currentPath;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }

    ctx.stroke();
  }
}

function drawHandles(points) {
  ctx.fillStyle = "red";
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function deselectAll() {
  paths.forEach(p => p.selected = false);
  selectedPath = null;
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function findPathNear(x, y) {
  return paths.find((path) =>
    path.points?.some((p) => distance(p.x, p.y, x, y) < 6) ||
    (path.type === "text" && distance(path.x, path.y, x, y) < 10)
  );
}

function findPointInPath(path, x, y) {
  return path.points?.findIndex((p) => distance(p.x, p.y, x, y) < 6);
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function exportAsSymbol() {
  const dataURL = canvas.toDataURL("image/png");
  if (window.opener && window.opener.receiveSymbol) {
    window.opener.receiveSymbol(dataURL);
    window.close();
  } else {
    alert("Open Animate is not open to receive symbol.");
  }
}

function saveIllustrator() {
  const data = JSON.stringify(paths);
  const blob = new Blob([data], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "illustrator-project.json";
  a.click();
}

function loadIllustrator() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      paths = JSON.parse(event.target.result);
      draw();
    };
    reader.readAsText(file);
  };
  input.click();
}
