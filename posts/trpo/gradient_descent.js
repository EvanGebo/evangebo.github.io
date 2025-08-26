const DIV = "#div-gradient-descent";

function goldsteinPrice(x, y) {
    return (1 + (x + y + 1) ** 2 * (19 - 14 * x + 3 * x ** 2 - 14 * y + 6 * x * y + 3 * y ** 2)) * (30 + (2 * x - 3 * y) ** 2 * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y ** 2));
}

document.addEventListener("DOMContentLoaded", function() {
    const y = d3.scaleLinear([-2, 1], [window.CONSTANTS.width, 0]);
    const x = d3.scaleLinear([-2, 2], [0, window.CONSTANTS.width]);

    const grid = (() => {
        const q = 2; // The level of detail, e.g., sample every 2 pixels in x and y.
        const x0 = -q / 2, x1 = window.CONSTANTS.width + q;
        const y0 = -q / 2, y1 = window.CONSTANTS.width + q;
        const n = Math.ceil((x1 - x0) / q);
        const m = Math.ceil((y1 - y0) / q);
        const grid = new Array(n * m);
        for (let j = 0; j < m; ++j) {
            for (let i = 0; i < n; ++i) {
                grid[j * n + i] = goldsteinPrice(x.invert(i * q + x0), y.invert(j * q + y0));
            }
        }
        grid.x = -q;
        grid.y = -q;
        grid.k = q;
        grid.n = n;
        grid.m = m;
        return grid;
    })();

    const thresholds = d3.range(1, 20).map(i => Math.pow(2, i));

    const transform = ({type, value, coordinates}) => {
        return {type, value, coordinates: coordinates.map(rings => {
            return rings.map(points => {
                return points.map(([x, y]) => ([
                    grid.x + grid.k * x,
                    grid.y + grid.k * y
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
        .style("width", "100%")
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
        const fx = goldsteinPrice(x0, y0);
        const dfdx = (goldsteinPrice(x0 + h, y0) - fx) / h;
        const dfdy = (goldsteinPrice(x0, y0 + h) - fx) / h;
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
    }
});
