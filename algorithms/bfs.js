async function bfs(start, end){
    const startTime = performance.now();

    const queue=[];

    const visited=new Set();

    const parent=new Map();

    let visitedCount=0;

    queue.push(start);

    visited.add(start);

    while (queue.length > 0) {

        const current = queue.shift();
        visitedCount++;

        if (current !== start && current !== end) {

            current.classList.add("visited");

            await sleep(getSpeed());

            if (stopExecution) {

                return;

            }

        }
        if(current===end){
            const endTime = performance.now();
            document.getElementById("executionTime").textContent =

        
            (endTime-startTime).toFixed(2)+" ms";
            document.getElementById("visitedCount").textContent =
        
            visitedCount;
            drawPath(parent,start,end);
            return;
        }


        
        
        

        const neighbours = getNeighbours(current);

        for (const next of neighbours) {

            if (visited.has(next)) continue;
            if (next.classList.contains("wall")) continue;

            visited.add(next);
            parent.set(next,current);
            queue.push(next);

        }

    }

    alert("No Path Found");

}

function getNeighbours(cell) {

    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    const neighbours = [];

    const directions = [
        [-1,0],
        [1,0],
        [0,-1],
        [0,1]
    ];

    for (const [dr, dc] of directions) {

        const nr = row + dr;
        const nc = col + dc;

        if (nr >= 0 && nr < 20 && nc >= 0 && nc < 30) {

            const neighbour = document.querySelector(
                `[data-row="${nr}"][data-col="${nc}"]`
            );

            neighbours.push(neighbour);

        }

    }

    return neighbours;

}

function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}
async function drawPath(parent,start,end){

    const path=[];

    let current=end;

    while(current!==start){

        path.push(current);

        current=parent.get(current);

    }

    path.push(start);

    path.reverse();

    let totalCost = 0;
    for (let i = 1; i < path.length; i++) {
        if (path[i].classList.contains("weight")) {
            totalCost += 5;
        } else {
            totalCost += 1;
        }
    }
    document.getElementById("pathLength").textContent = totalCost;

    for(const node of path){

        if(node!==start && node!==end){

            node.classList.remove("visited");

            node.classList.add("path");

            await sleep(getSpeed());

            if(stopExecution){

                return;

            }

        }

    }

}