import time
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

ROWS = 20
COLS = 30

def get_neighbours(row, col, walls):
    neighbours = []
    # North, South, West, East matching JS order
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    for dr, dc in directions:
        nr, nc = row + dr, col + dc
        if 0 <= nr < ROWS and 0 <= nc < COLS:
            if (nr, nc) not in walls:
                neighbours.append((nr, nc))
    return neighbours

def heuristic(a, b):
    # Manhattan distance
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def solve_bfs(start, end, walls):
    queue = [start]
    visited = {start}
    parent = {}
    visited_order = []
    
    found = False
    while queue:
        current = queue.pop(0)
        visited_order.append(current)
        
        if current == end:
            found = True
            break
            
        for neighbor in get_neighbours(current[0], current[1], walls):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = current
                queue.append(neighbor)
                
    path = []
    if found:
        curr = end
        while curr != start:
            path.append(curr)
            curr = parent[curr]
        path.append(start)
        path.reverse()
        
    return visited_order, path

def solve_dfs(start, end, walls):
    stack = [start]
    visited = set()
    parent = {}
    visited_order = []
    
    found = False
    while stack:
        current = stack.pop()
        if current in visited:
            continue
            
        visited.add(current)
        visited_order.append(current)
        
        if current == end:
            found = True
            break
            
        neighbours = get_neighbours(current[0], current[1], walls)
        # Reverse order for DFS traversal structure matching client-side
        for neighbor in reversed(neighbours):
            if neighbor not in visited:
                if neighbor not in parent:
                    parent[neighbor] = current
                stack.append(neighbor)
                
    path = []
    if found:
        curr = end
        while curr != start:
            path.append(curr)
            curr = parent[curr]
        path.append(start)
        path.reverse()
        
    return visited_order, path

def solve_dijkstra(start, end, walls, weights=set()):
    distance = {}
    parent = {}
    visited = set()
    visited_order = []
    
    # Initialize distances
    for r in range(ROWS):
        for c in range(COLS):
            distance[(r, c)] = float('inf')
    distance[start] = 0
    
    found = False
    while True:
        current = None
        min_dist = float('inf')
        
        # Find the node with the minimum distance
        for r in range(ROWS):
            for c in range(COLS):
                node = (r, c)
                if node not in visited and distance[node] < min_dist:
                    min_dist = distance[node]
                    current = node
                    
        if current is None or min_dist == float('inf'):
            break
            
        if current in walls:
            visited.add(current)
            continue
            
        visited.add(current)
        visited_order.append(current)
        
        if current == end:
            found = True
            break
            
        for neighbor in get_neighbours(current[0], current[1], walls):
            if neighbor in visited:
                continue
            new_dist = distance[current] + (5 if neighbor in weights else 1)
            if new_dist < distance[neighbor]:
                distance[neighbor] = new_dist
                parent[neighbor] = current
                
    path = []
    if found:
        curr = end
        while curr != start:
            path.append(curr)
            curr = parent[curr]
        path.append(start)
        path.reverse()
        
    return visited_order, path

def solve_astar(start, end, walls, weights=set()):
    open_set = [start]
    came_from = {}
    
    g_score = {}
    f_score = {}
    for r in range(ROWS):
        for c in range(COLS):
            g_score[(r, c)] = float('inf')
            f_score[(r, c)] = float('inf')
            
    g_score[start] = 0
    f_score[start] = heuristic(start, end)
    
    visited_order = []
    found = False
    
    while open_set:
        # Sort by f_score
        open_set.sort(key=lambda x: f_score[x])
        current = open_set.pop(0)
        
        visited_order.append(current)
        
        if current == end:
            found = True
            break
            
        for neighbor in get_neighbours(current[0], current[1], walls):
            temp_g_score = g_score[current] + (5 if neighbor in weights else 1)
            
            if temp_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = temp_g_score
                f_score[neighbor] = temp_g_score + heuristic(neighbor, end)
                if neighbor not in open_set:
                    open_set.append(neighbor)
                    
    path = []
    if found:
        curr = end
        while curr != start:
            path.append(curr)
            curr = came_from[curr]
        path.append(start)
        path.reverse()
        
    return visited_order, path

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "Pathfinding API Backend"}), 200

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.json
    if not data:
        return jsonify({"error": "Missing payload"}), 400
        
    algo = data.get('algorithm')
    start_list = data.get('start')  # [row, col]
    end_list = data.get('end')      # [row, col]
    walls_list = data.get('walls', []) # [[row, col], ...]
    weights_list = data.get('weights', []) # [[row, col], ...]
    
    if not algo or not start_list or not end_list:
        return jsonify({"error": "Missing parameters"}), 400
        
    start = (start_list[0], start_list[1])
    end = (end_list[0], end_list[1])
    walls = {tuple(w) for w in walls_list}
    weights = {tuple(w) for w in weights_list}
    
    start_time = time.perf_counter()
    
    if algo == 'bfs':
        visited, path = solve_bfs(start, end, walls)
    elif algo == 'dfs':
        visited, path = solve_dfs(start, end, walls)
    elif algo == 'dijkstra':
        visited, path = solve_dijkstra(start, end, walls, weights)
    elif algo == 'astar':
        visited, path = solve_astar(start, end, walls, weights)
    else:
        return jsonify({"error": f"Unknown algorithm: {algo}"}), 400
        
    execution_time_ms = (time.perf_counter() - start_time) * 1000
    
    # Format return collections to lists of lists for JSON serialization
    serialized_visited = [[v[0], v[1]] for v in visited]
    serialized_path = [[p[0], p[1]] for p in path]
    
    return jsonify({
        "visited": serialized_visited,
        "path": serialized_path,
        "executionTimeMs": round(execution_time_ms, 2)
    }), 200

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=True)
