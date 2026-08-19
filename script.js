const ROWS = 20;
const COLS = 30;

const grid = document.getElementById("grid");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const solverSourceBadge = document.getElementById("solverSourceBadge");

let startNode = null;
let endNode = null;
let mouseDown = false;
let movingStart = false;
let movingEnd = false;
let isRunning = false;
let stopExecution = false;

// Speed translation function (smaller values = faster, matching original)
function getSpeed() {
    return 101 - Number(speedSlider.value);
}

// Update speed slider display value
speedSlider.addEventListener("input", () => {
    speedValue.textContent = `${getSpeed()}ms`;
});
speedValue.textContent = `${getSpeed()}ms`;

// Create Grid Cells
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.row = r;
        cell.dataset.col = c;

        // Left Click to place Start and End if not set
        cell.addEventListener("click", () => {
            if (isRunning) return;
            
            if (startNode == null) {
                startNode = cell;
                cell.classList.add("start");
                return;
            }

            if (endNode == null && cell !== startNode) {
                endNode = cell;
                cell.classList.add("end");
                return;
            }
        });

        // Mouse Down logic (Start dragging nodes or drawing walls/weights)
        cell.addEventListener("mousedown", () => {
            if (isRunning) return;
            
            mouseDown = true;

            if (cell === startNode) {
                movingStart = true;
                return;
            }

            if (cell === endNode) {
                movingEnd = true;
                return;
            }

            if (startNode && endNode) {
                const drawTool = document.querySelector('input[name="drawTool"]:checked').value;
                if (drawTool === "wall") {
                    cell.classList.remove("weight");
                    cell.classList.toggle("wall");
                } else {
                    cell.classList.remove("wall");
                    cell.classList.toggle("weight");
                }
            }
        });

        // Mouse Enter (Dragging Start/End nodes or drawing multiple walls/weights)
        cell.addEventListener("mouseenter", () => {
            if (!mouseDown || isRunning) return;

            if (movingStart) {
                if (cell === endNode) return;
                startNode.classList.remove("start");
                startNode = cell;
                startNode.classList.remove("wall");
                startNode.classList.remove("weight");
                startNode.classList.add("start");
                return;
            }

            if (movingEnd) {
                if (cell === startNode) return;
                endNode.classList.remove("end");
                endNode = cell;
                endNode.classList.remove("wall");
                endNode.classList.remove("weight");
                endNode.classList.add("end");
                return;
            }

            if (cell !== startNode && cell !== endNode) {
                const drawTool = document.querySelector('input[name="drawTool"]:checked').value;
                if (drawTool === "wall") {
                    cell.classList.remove("weight");
                    cell.classList.add("wall");
                } else {
                    cell.classList.remove("wall");
                    cell.classList.add("weight");
                }
            }
        });

        grid.appendChild(cell);
    }
}

// Global mouseup release
document.addEventListener("mouseup", () => {
    mouseDown = false;
    movingStart = false;
    movingEnd = false;
});

// Clear Grid function
document.getElementById("clearGrid").onclick = () => {
    if (isRunning) return;
    
    startNode = null;
    endNode = null;

    document.querySelectorAll(".cell").forEach(cell => {
        cell.className = "cell";
    });

    document.getElementById("visitedCount").textContent = 0;
    document.getElementById("pathLength").textContent = 0;
    document.getElementById("executionTime").textContent = "0 ms";
    solverSourceBadge.classList.add("d-none");
};

// Determine the API base URL dynamically.
// If the page is opened from files (file:///) or on a different port, point to the Flask server on port 5001.
const API_BASE = window.location.port === '5001' ? '' : 'http://127.0.0.1:5001';

// Check Python Flask server health on startup
async function checkServerHealth() {
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");
    const modeServer = document.getElementById("modeServer");
    const modeServerLabel = document.getElementById("modeServerLabel");

    try {
        const response = await fetch(`${API_BASE}/api/health`);
        if (response.ok) {
            statusDot.className = "status-dot online";
            statusText.textContent = "Server Connected";
            statusText.className = "status-text text-success";
            
            // Auto Select Server mode if available
            modeServer.disabled = false;
            modeServer.checked = true;
            modeServerLabel.style.opacity = "1";
            modeServerLabel.style.cursor = "pointer";
        } else {
            throw new Error("unhealthy");
        }
    } catch (err) {
        statusDot.className = "status-dot offline";
        statusText.textContent = "Server Offline (Client Mode)";
        statusText.className = "status-text text-danger";
        
        // Fail over and force client mode
        document.getElementById("modeClient").checked = true;
        modeServer.disabled = true;
        modeServerLabel.style.opacity = "0.5";
        modeServerLabel.style.cursor = "not-allowed";
    }
}

checkServerHealth();

// Start Algorithm Execution
document.getElementById("startBtn").addEventListener("click", async () => {
    if (isRunning) return;

    if (!startNode || !endNode) {
        alert("Please set both a Start and an End node on the grid first.");
        return;
    }

    isRunning = true;
    stopExecution = false;

    // Toggle button UI states during run
    document.getElementById("startBtn").disabled = true;
    document.getElementById("clearGrid").disabled = true;
    document.getElementById("mazeBtn").disabled = true;

    // Reset previous visited/path states
    document.querySelectorAll(".visited, .path").forEach(cell => {
        cell.classList.remove("visited");
        cell.classList.remove("path");
    });

    document.getElementById("visitedCount").textContent = 0;
    document.getElementById("pathLength").textContent = 0;
    document.getElementById("executionTime").textContent = "0 ms";

    const algo = document.getElementById("algorithm").value;
    const mode = document.querySelector('input[name="execMode"]:checked').value;

    if (mode === "server") {
        await runServerSideSearch(algo);
    } else {
        // Run Client-Side (JS file scripts)
        solverSourceBadge.textContent = "Client JS";
        solverSourceBadge.className = "badge bg-info ms-2";
        
        if (algo === "bfs") {
            await bfs(startNode, endNode);
        } else if (algo === "dfs") {
            await dfs(startNode, endNode);
        } else if (algo === "dijkstra") {
            await dijkstra(startNode, endNode);
        } else {
            await astar(startNode, endNode);
        }
    }

    isRunning = false;
    document.getElementById("startBtn").disabled = false;
    document.getElementById("clearGrid").disabled = false;
    document.getElementById("mazeBtn").disabled = false;
});

// Stop Execution Handler
document.getElementById("stopBtn").addEventListener("click", () => {
    stopExecution = true;
});

// Generate Maze Handler
document.getElementById("mazeBtn").addEventListener("click", generateMaze);

function generateMaze() {
    if (isRunning) return;
    
    const cells = document.querySelectorAll(".cell");

    cells.forEach(cell => {
        cell.classList.remove("wall");
        cell.classList.remove("weight");
        cell.classList.remove("visited");
        cell.classList.remove("path");
    });

    cells.forEach(cell => {
        if (cell === startNode || cell === endNode) return;

        if (Math.random() < 0.30) {
            cell.classList.add("wall");
        }
    });
}

// Server Side Solves and Animation controller
async function runServerSideSearch(algorithmName) {
    solverSourceBadge.textContent = "Python API";
    solverSourceBadge.className = "badge bg-purple ms-2"; // styled specifically via status

    // Parse start and end positions
    const startRow = Number(startNode.dataset.row);
    const startCol = Number(startNode.dataset.col);
    const endRow = Number(endNode.dataset.row);
    const colEnd = Number(endNode.dataset.col);

    // Collect all wall segments
    const walls = [];
    document.querySelectorAll(".cell.wall").forEach(cell => {
        walls.push([Number(cell.dataset.row), Number(cell.dataset.col)]);
    });

    // Collect all weight segments
    const weights = [];
    document.querySelectorAll(".cell.weight").forEach(cell => {
        weights.push([Number(cell.dataset.row), Number(cell.dataset.col)]);
    });

    const payload = {
        algorithm: algorithmName,
        start: [startRow, startCol],
        end: [endRow, colEnd],
        walls: walls,
        weights: weights
    };

    try {
        const response = await fetch(`${API_BASE}/api/solve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Server Solver failed with code ${response.status}`);
        }

        const result = await response.json();
        
        // Display Server execution time
        document.getElementById("executionTime").textContent = `${result.executionTimeMs.toFixed(2)} ms`;
        
        // Animate visited Explorer list in order
        const visitedList = result.visited || [];
        const pathList = result.path || [];
        let visitedCounter = 0;

        for (const [r, c] of visitedList) {
            if (stopExecution) return;

            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell && cell !== startNode && cell !== endNode) {
                cell.classList.add("visited");
                visitedCounter++;
                document.getElementById("visitedCount").textContent = visitedCounter;
                await sleep(getSpeed());
            }
        }

        if (pathList.length === 0) {
            alert("No Path Found by Server");
            return;
        }

        // Display path statistics (calculating cost based on weights)
        let totalCost = 0;
        for (let i = 1; i < pathList.length; i++) {
            const [r, c] = pathList[i];
            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell && cell.classList.contains("weight")) {
                totalCost += 5;
            } else {
                totalCost += 1;
            }
        }
        document.getElementById("pathLength").textContent = totalCost;

        // Animate path nodes in order
        for (const [r, c] of pathList) {
            if (stopExecution) return;

            const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
            if (cell && cell !== startNode && cell !== endNode) {
                cell.classList.remove("visited");
                cell.classList.add("path");
                await sleep(getSpeed());
            }
        }

    } catch (error) {
        console.error("API error:", error);
        alert(`An error occurred connecting to the backend solving API: ${error.message}. Defaulting to Browser JS mode.`);
        checkServerHealth();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
