function goldsteinPrice(x, y) {
    return (1 + (x + y + 1) ** 2 * (19 - 14 * x + 3 * x ** 2 - 14 * y + 6 * x * y + 3 * y ** 2)) * (30 + (2 * x - 3 * y) ** 2 * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y ** 2));
}

function quadratic(M, x) {
    return math.dot(x, math.multiply(M, x));
}

function quadraticGradient(M, x) {
    return math.multiply(2, math.multiply(M, x));
}

function quadraticHessian(M, x) {
    return math.multiply(2, M);
}

M = window.UTILS.psdMatrix(1, 10, 1000);

function generateGrid(x, y, resolution, f) {
    const grid = [];
    grid.resolution = resolution;
    grid.x = -grid.resolution;
    grid.y = -grid.resolution;

    const x0 = -grid.resolution / 2;
    const x1 = window.CONSTANTS.width + grid.resolution;
    const y0 = -grid.resolution / 2;
    const y1 = window.CONSTANTS.width + grid.resolution;

    grid.n = Math.ceil((x1 - x0) / grid.resolution);
    grid.m = Math.ceil((y1 - y0) / grid.resolution);

    for (let j = x0; j <= x1; j += grid.resolution) {
        for (let i = y0; i <= y1; i += grid.resolution) {
            grid.push(f(x.invert(i), y.invert(j)));
        }
    }

    return grid;
}

document.addEventListener("DOMContentLoaded", function() {
    const DIV = "#div-gradient-descent";

    const y = d3.scaleLinear([-2, 1], [window.CONSTANTS.width, 0]);
    const x = d3.scaleLinear([-2, 2], [0, window.CONSTANTS.width]);

    f = goldsteinPrice;
    // f = (x, y) => quadratic(M, math.matrix([x, y]));
    grid = generateGrid(x, y, 2, f);

    const thresholds = d3.range(1, 20).map(i => Math.pow(2, i));

    const transform = ({type, value, coordinates}) => {
        return {type, value, coordinates: coordinates.map(rings => {
            return rings.map(points => {
                return points.map(([x, y]) => ([
                    grid.x + grid.resolution * x,
                    grid.y + grid.resolution * y
                ]));
            });
        })};
    };

    const contoursData = d3.contours()
        .size([grid.n, grid.m])
        .thresholds(thresholds)
        (grid)
        .map(transform);

    const color = d3.scaleSequentialLog(d3.extent(thresholds), d3.interpolateMagma);

    const svg = d3.select(DIV)
        .append("svg")
        .attr("viewBox", [0, 0, window.CONSTANTS.width, window.CONSTANTS.width])
        .style("display", "block")
        .style("width", `100%`)
        .style("height", "100%");

    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .selectAll("path")
        .data(contoursData)
        .join("path")
        .attr("fill", d => color(d.value))
        .attr("d", d3.geoPath());
    
    svg.insert("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", window.CONSTANTS.width)
        .attr("height", window.CONSTANTS.width)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    let trajectory = [ { ...window.GLOBAL_STATE.point } ];

    const drag = d3.drag()
        .on("drag", function(event) {
            const px = Math.max(0, Math.min(window.CONSTANTS.width, event.x));
            const py = Math.max(0, Math.min(window.CONSTANTS.width, event.y));
            window.GLOBAL_STATE.point.x = x.invert(px);
            window.GLOBAL_STATE.point.y = y.invert(py);
            d3.select(this)
                .attr("cx", px)
                .attr("cy", py);
            runGradientDescent();
        });

    runGradientDescent();
    const pointCircle = svg.append("circle")
        .attr("id", "draggable-point")
        .attr("r", 7)
        .attr("fill", "#222")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 2)
        .attr("cx", x(window.GLOBAL_STATE.point.x))
        .attr("cy", y(window.GLOBAL_STATE.point.y))
        .style("cursor", "move")
        .call(drag);

    function grad_f(x0, y0) {
        const h = 1e-6;
        const fx = f(x0, y0);
        const dfdx = (f(x0 + h, y0) - fx) / h;
        const dfdy = (f(x0, y0 + h) - fx) / h;
        return [dfdx, dfdy];
    }

    function runGradientDescent() {
        let [px, py] = [window.GLOBAL_STATE.point.x, window.GLOBAL_STATE.point.y];
        const tol = 1e-6;
        trajectory = [ { x: px, y: py } ];
        for (let i = 0; i < window.GLOBAL_STATE.lrSchedule.length; ++i) {
            const [gx, gy] = grad_f(px, py);
            const norm = Math.sqrt(gx*gx + gy*gy);
            if (norm < tol) break;
            px -= window.GLOBAL_STATE.lrSchedule[i] * gx;
            py -= window.GLOBAL_STATE.lrSchedule[i] * gy;
            trajectory.push({ x: px, y: py });
        }
        drawTrajectory();
    }
    window.addEventListener("lrScheduleChanged", runGradientDescent);

    function drawTrajectory() {
        svg.selectAll(".gd-path").remove();
        svg.selectAll(".gd-end-marker").remove();
        // Draw the path before the dot so the dot is always on top
        svg.insert("path", "#draggable-point")
            .datum(trajectory)
            .attr("class", "gd-path")
            .attr("fill", "none")
            .attr("stroke", "#36afff")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.x))
                .y(d => y(d.y))
            );

        // Determine convergence: if the last step's gradient norm < tol, converged
        let converged = false;
        if (trajectory.length > 1) {
            const last = trajectory[trajectory.length - 1];
            const [gx, gy] = grad_f(last.x, last.y);
            const norm = Math.sqrt(gx*gx + gy*gy);
            converged = norm < 1e-6;
        }
        const last = trajectory[trajectory.length - 1];
        const markerWidth = 6;
        if (converged) {
            svg.append("rect")
                .attr("class", "gd-end-marker")
                .attr("x", x(last.x) - markerWidth / 2)
                .attr("y", y(last.y) - markerWidth / 2)
                .attr("width", markerWidth)
                .attr("height", markerWidth)
                .attr("fill", "#0f0")
                .attr("stroke", "#222")
                .attr("stroke-width", 1);
        } else {
            svg.append("rect")
                .attr("class", "gd-end-marker")
                .attr("x", x(last.x) - markerWidth / 2)
                .attr("y", y(last.y) - markerWidth / 2)
                .attr("width", markerWidth)
                .attr("height", markerWidth)
                .attr("fill", "#f00")
                .attr("stroke", "#222")
                .attr("stroke-width", 1);
        }
    }
});
