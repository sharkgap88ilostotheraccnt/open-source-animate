const canvas = document.getElementById("illustratorCanvas");
const ctx = canvas.getContext("2d");

let tool = "brush";
let drawing = false;
let currentPath = [];
let paths = []; // {type, points, color, selected}

let selectedPath = null;
let draggingPoint = null;

const color = "#000";
const lineWidth = 2;

// Toolbar buttons
document.querySelectorAll(".toolbar button").forEach((btn, index) => {
  btn.addEventListener("click", () => {
    const tools = ["brush", "eraser", "fill", "shapes", "text"];
    tool = tools[index] || "brush";
    if (tool === "shapes") tool = "line";
    if (tool === "text") tool = "select"; // repurpose as select for now
  });
});

// Mouse events
canvas.addEventListener("mousedown", (e) => {
  const {x, y} = getMousePos(e);

  if (tool === "brush" || tool === "line") {
    drawing = true;
    currentPath = [{x, y}];
    if (tool === "line") {
      currentPath.push({x, y});
    }
  } else if (tool === "select") {
    selectedPath = findPathNear(x, y);
    if (selectedPath) {
      draggingPoint = findPointInPath(selectedPath, x, y);
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  const {x, y} = getMousePos(e);

  if (!drawing && !draggingPoint) return;

  if (tool === "brush") {
    currentPath.push({x, y});
    draw();
  } else if (tool === "line") {
    currentPath[1] = {x, y};
    draw();
  } else if (tool === "select" && selectedPath && draggingPoint !== null) {
    selectedPath.points[draggingPoint] = {x, y};
    draw();
  }
});

canvas.addEventListener("mouseup", () => {
  if (drawing) {
    if (currentPath.length > 0) {
      paths.push({
        type: tool,
        points: [...currentPath],
        color,
        selected: false
      });
    }
    currentPath = [];
    drawing = false;
    draw();
  }
  draggingPoint = null;
});

// Drawing
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paths.forEach((path) => {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = path.color;

    if (path.type === "brush") {
      path.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
    } else if (path.type === "line") {
      const [p1, p2] = path.points;
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }

    ctx.stroke();

    if (path.selected) {
      drawHandles(path.points);
    }
  });

  // Current drawing
  if (currentPath.length > 0) {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

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

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function findPathNear(x, y) {
  return paths.find((path) =>
    path.points.some((p) => distance(p.x, p.y, x, y) < 6)
  );
}

function findPointInPath(path, x, y) {
  return path.points.findIndex((p) => distance(p.x, p.y, x, y) < 6);
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Export to Open Animate as symbol
function exportAsSymbol() {
  const dataURL = canvas.toDataURL("image/png");
  if (window.opener && window.opener.receiveSymbol) {
    window.opener.receiveSymbol(dataURL);
    window.close();
  } else {
    alert("Open Animate is not open to receive symbol.");
  }
}

// Save/load illustrator project
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
