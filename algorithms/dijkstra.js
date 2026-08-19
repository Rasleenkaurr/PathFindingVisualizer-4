async function dijkstra(start, end) {

    const startTime = performance.now();

    const cells = [...document.querySelectorAll(".cell")];

    const distance = new Map();
    const parent = new Map();
    const visited = new Set();

    cells.forEach(cell => {
        distance.set(cell, Infinity);
    });

    distance.set(start, 0);

    let visitedCount = 0;

    while (true) {

        let current = null;
        let minDistance = Infinity;

        // Find the unvisited node with the smallest distance
        cells.forEach(cell => {

            if (!visited.has(cell) &&
                distance.get(cell) < minDistance) {

                minDistance = distance.get(cell);
                current = cell;

            }

        });

        if (current === null)
            break;

        if (current.classList.contains("wall")) {
            visited.add(current);
            continue;
        }

        visited.add(current);
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

            await drawPath(parent, start, end);

            return;

        }

        const neighbours = getNeighbours(current);

        neighbours.forEach(next => {

            if (visited.has(next))
                return;

            if (next.classList.contains("wall"))
                return;

            const weight = next.classList.contains("weight") ? 5 : 1;
            const newDistance = distance.get(current) + weight;

            if (newDistance < distance.get(next)) {

                distance.set(next, newDistance);
                parent.set(next, current);

            }

        });

    }

    alert("No Path Found");
}