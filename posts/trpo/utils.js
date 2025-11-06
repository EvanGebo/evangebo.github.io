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
    const innerWidth = document.querySelector(".level1").offsetWidth;
    const fullWidth = document.querySelector(".column-body-outset").offsetWidth;
    const margin = (fullWidth - innerWidth) / 2;
    const w = innerWidth;
    const h = innerWidth * height / 100;
    const svg = d3.select(div)
        .append("svg")
        .attr("viewBox", [-margin, 0, fullWidth, h])
        .style("width", `${fullWidth}px`)
        .style("height", `${h}px`);
    return { svg, w, h };
}

window.UTILS = {
    rotationMatrix,
    psdMatrix,
    getSVG
};

window.GLOBAL_STATE = window.GLOBAL_STATE || {
    point: { x: 0, y: 0 },
    lrSchedule: []
};

window.CONSTANTS = window.CONSTANTS || {
    width: 500
};
