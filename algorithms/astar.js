function heuristic(a, b) {

    const rowA = Number(a.dataset.row);
    const colA = Number(a.dataset.col);

    const rowB = Number(b.dataset.row);
    const colB = Number(b.dataset.col);

    return Math.abs(rowA - rowB) + Math.abs(colA - colB);

}

async function astar(start, end) {

    const startTime = performance.now();

    const openSet = [start];

    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    document.querySelectorAll(".cell").forEach(cell => {

        gScore.set(cell, Infinity);
        fScore.set(cell, Infinity);

    });

    gScore.set(start, 0);
    fScore.set(start, heuristic(start, end));

    let visitedCount = 0;

    while (openSet.length > 0) {

        openSet.sort((a, b) => fScore.get(a) - fScore.get(b));

        const current = openSet.shift();

        visitedCount++;

        if (current !== start && current !== end) {

            current.classList.add("visited");

            await sleep(getSpeed());

            if (stopExecution) {

                return;

            }

        }

        if (current === end) {

            document.getElementById("visitedCount").textContent = visitedCount;

            document.getElementById("executionTime").textContent =
                (performance.now() - startTime).toFixed(2) + " ms";

            await drawPath(cameFrom, start, end);

            return;

        }

        const neighbours = getNeighbours(current);

        neighbours.forEach(next => {

            if (next.classList.contains("wall"))
                return;

            const weight = next.classList.contains("weight") ? 5 : 1;
            const temp = gScore.get(current) + weight;

            if (temp < gScore.get(next)) {

                cameFrom.set(next, current);

                gScore.set(next, temp);

                fScore.set(next, temp + heuristic(next, end));

                if (!openSet.includes(next))
                    openSet.push(next);

            }

        });

    }

    alert("No Path Found");

}