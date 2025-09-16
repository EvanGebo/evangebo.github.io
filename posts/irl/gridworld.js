const map1 = `
########
#S.....#
#.#.##.#
#.#....#
#.#.##.#
#......#
#.....A#
########
`;
const map = parseMap(map1);
const gridSize = map.length;


const Tiles = {
    '#': { color: '#222222' },
    'S': { color: 'blue' },
    '.': { color: '#aaaaaa' },
    'A': { color: 'gold' },
};

function oneHotEncode(tile) {
    return Object.keys(Tiles).map(key => (key === tile ? 1 : 0));
}

function parseMap(map) {
    return map.trim().split("\n").map(row => row.split("").map(char => {
        if (Tiles[char]) {
            return char;
        }
        return null; // Unknown tile type
    }));
}

function drawTrajectory(svg, trajectory) {
    trajectory.forEach((point, index) => {
        if (index < trajectory.length - 1) {
            const nextPoint = trajectory[index + 1];

            const startX = point.x * cellSize + cellSize / 2;
            const startY = point.y * cellSize + cellSize / 2;
            const endX = nextPoint.x * cellSize + cellSize / 2;
            const endY = nextPoint.y * cellSize + cellSize / 2;

            svg.append("line")
                .attr("x1", startX)
                .attr("y1", startY)
                .attr("x2", endX)
                .attr("y2", endY)
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

document.addEventListener("DOMContentLoaded", function () {
    const DIV = "#div-gridworld";

    const { svg, w, h, m } = window.UTILS.getSVG(DIV, 100);

    
    const cellSize = w / gridSize;

    function drawTrajectory(svg, trajectory) {
        trajectory.forEach((point, index) => {
            if (index < trajectory.length - 1) {
                const nextPoint = trajectory[index + 1];
                const direction = {
                    x: nextPoint[0] - point[0],
                    y: nextPoint[1] - point[1]
                };

                let x0 = point[0] * cellSize + cellSize / 2;
                let y0 = point[1] * cellSize + cellSize / 2;
                let x1 = nextPoint[0] * cellSize + cellSize / 2;
                let y1 = nextPoint[1] * cellSize + cellSize / 2;

                const margin = 0 * cellSize;
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

    // Draw the tiles
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const char = map[y][x];
            if (Tiles[char]) {
                svg.append("rect")
                    .attr("x", x * cellSize)
                    .attr("y", y * cellSize)
                    .attr("width", cellSize)
                    .attr("height", cellSize)
                    .attr("fill", Tiles[char].color);
            }
        }
    }

    for (let i = 0; i <= gridSize; i++) {
        svg.append("line")
            .attr("x1", i * cellSize)
            .attr("y1", 0)
            .attr("x2", i * cellSize)
            .attr("y2", w)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2); // Make the grid lines thicker

        svg.append("line")
            .attr("x1", 0)
            .attr("y1", i * cellSize)
            .attr("x2", w)
            .attr("y2", i * cellSize)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2); // Make the grid lines thicker
    }

    let t = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5], [4, 6], [5, 6], [6, 6]];
    drawTrajectory(svg, t);
});
