const Tiles = {
    '#': { color: '#222222' },
    'S': { color: 'blue' },
    '.': { color: '#aaaaaa' },
    'A': { color: 'gold' },
};

const Actions = [
    {name: "N", d: {x: 0, y: 1}},
    {name: "E", d: {x: 1, y: 0}},
    {name: "S", d: {x: 0, y: -1}},
    {name: "W", d: {x: -1, y: 0}}
];

function is_wall(grid, s) {
    return (s.x < 0 || s.x >= grid[0].length || s.y < 0 || s.y >= grid.length || grid[s.y][s.x] === "#");
}

function is_terminal(grid, s) {
    return grid[s.y][s.x] === "A";
}

GRID_COLOR = "#ffffff";
GRID_WIDTH = 2;

function parse_map_string(map) {
    return map.trim().split("\n").map(row => row.split("").map(char => {
        if (Tiles[char]) {
            return char;
        }
        return null;
    }));
}

function draw_trajectory(svg, trajectory, cell_size) {
    trajectory.forEach((point, index) => {
        if (index < trajectory.length - 1) {
            const next_point = trajectory[index + 1];
            const direction = {
                x: next_point[0] - point[0],
                y: next_point[1] - point[1]
            };

            let x0 = point[0] * cell_size + cell_size / 2;
            let y0 = point[1] * cell_size + cell_size / 2;
            let x1 = next_point[0] * cell_size + cell_size / 2;
            let y1 = next_point[1] * cell_size + cell_size / 2;

            const margin = 0.1 * cell_size;
            if (direction.x === 0 && direction.y === 1) {
                y0 += margin;
                y1 -= margin;
            } else if (direction.x === 0 && direction.y === -1) {
                y0 -= margin;
                y1 += margin;
            } else if (direction.x === 1 && direction.y === 0) {
                x0 += margin;
                x1 -= margin;
            } else if (direction.x === -1 && direction.y === 0) {
                x0 -= margin;
                x1 += margin;
            }

            svg.append("line")
                .attr("x1", x0)
                .attr("y1", y0)
                .attr("x2", x1)
                .attr("y2", y1)
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("marker-end", "url(#arrow)");
            svg.append("defs")
                .append("marker")
                .attr("id", "arrow")
                .attr("viewBox", "0 0 10 10")
                .attr("refX", 5)
                .attr("refY", 5)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto-start-reverse")
                .append("path")
                .attr("d", "M 0 0 L 10 5 L 0 10 Z")
                .attr("fill", "red");
        }
    });
}

function draw_gridworld(svg, map, cell_size) {
    const height = map.length;
    const width = map[0].length;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = Tiles[map[y][x]];
            if (tile) {
                svg.append("rect")
                    .attr("x", x * cell_size)
                    .attr("y", y * cell_size)
                    .attr("width", cell_size)
                    .attr("height", cell_size)
                    .attr("fill", tile.color);
            }
        }
    }

    for (let y = 0; y < height; y++) {
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", y * cell_size)
            .attr("x2", width * cell_size)
            .attr("y2", y * cell_size)
            .attr("stroke", GRID_COLOR)
            .attr("stroke-width", GRID_WIDTH);
    }

    for (let x = 0; x < width; x++) {
        svg.append("line")
            .attr("x1", x * cell_size)
            .attr("y1", 0)
            .attr("x2", x * cell_size)
            .attr("y2", height * cell_size)
            .attr("stroke", GRID_COLOR)
            .attr("stroke-width", GRID_WIDTH);
    }
}
