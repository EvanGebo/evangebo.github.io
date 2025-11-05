function rotationMatrix(angle) {
    const cos = math.cos(angle);
    const sin = math.sin(angle);
    return math.matrix([
        [cos, -sin],
        [sin, cos]
    ]);
}

function psdMatrix(angle, conditionNumber, scale) {
    const rotation = rotationMatrix(angle);
    const scaling = math.diag([conditionNumber, 1]);
    return math.multiply(math.multiply(math.multiply(rotation, scaling), math.transpose(rotation)), scale);
}

function getSVG(div, height) {
    const innerWidth = document.querySelector(".column-body").offsetWidth;
    const fullWidth = document.querySelector(".column-body-outset").offsetWidth;
    const margin = (fullWidth - innerWidth) / 2;
    console.log("innerWidth:", innerWidth);
    console.log("fullWidth:", fullWidth);
    console.log("margin:", margin);
    const w = innerWidth;
    const h = innerWidth * height / 100;
    const m = margin;
    const svg = d3.select(div)
        .append("svg")
        .attr("viewBox", [-m, 0, fullWidth, h])
        .attr("display", "block")
        .style("width", `${fullWidth}px`)
        .style("height", `${h}px`);
    return { svg, w, h, m };
}

function linspace(domain, n) {
    const [start, stop] = domain;
    const step = (stop - start) / (n - 1);
    return Array.from({ length: n }, (_, i) => start + i * step);
}

function clamp(domain, n) {
    const [min, max] = domain;
    return Math.max(min, Math.min(max, n));
}

function generateGrid(x, y, resolution, f) {
    const xs = linspace(x.domain(), resolution);
    const ys = linspace(y.domain(), resolution);

    const grid = [];
    for (const i of xs) {
        for (const j of ys) {
            grid.push(f(i, j));
        }
    }

    return grid;
}

function getThresholds(grid, n, scaling) {
    const min = d3.min(grid);
    const max = d3.max(grid);
    if (scaling == "log") {
        return d3.range(n).map(i => math.exp(math.log(min) + (math.log(max) - math.log(min)) * i / (n - 1)));
    } else if (scaling == "linear") {
        return d3.range(n).map(i => min + (max - min) * i / (n - 1));
    }
}

function finite_differences(x, y, f, h = 1e-6) {
    const dfdx = (f(x + h, y) - f(x, y)) / h;
    const dfdy = (f(x, y + h) - f(x, y)) / h;
    return [dfdx, dfdy];
}

window.UTILS = {
    rotationMatrix,
    psdMatrix,
    getSVG,
    linspace,
    getThresholds,
    finite_differences,
    clamp,
    generateGrid
};

window.GLOBAL_STATE = window.GLOBAL_STATE || {
    point: { x: 0, y: 0 },
    lrSchedule: [],
    f: null,
    function2svg: null
};

window.CONSTANTS = window.CONSTANTS || {
    width: 500
};
