async function dfs(start, end) {

    const startTime = performance.now();

    const stack = [];
    const visited = new Set();
    const parent = new Map();

    let visitedCount = 0;

    stack.push(start);

    while (stack.length > 0) {

        const current = stack.pop();

        if (visited.has(current))
            continue;

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

            const endTime = performance.now();

            document.getElementById("executionTime").textContent =
                (endTime - startTime).toFixed(2) + " ms";

            document.getElementById("visitedCount").textContent =
                visitedCount;

             await drawPath(parent, start, end);

            return;
        }

        const neighbours = getNeighbours(current);

        // Reverse order for better visualization
        for (let i = neighbours.length - 1; i >= 0; i--) {

            const next = neighbours[i];

            if (visited.has(next))
                continue;

            if (next.classList.contains("wall"))
                continue;

            if (!parent.has(next))
                parent.set(next, current);

            stack.push(next);

        }

    }

    alert("No Path Found");
}

