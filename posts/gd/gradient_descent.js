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

const M = window.UTILS.psdMatrix(1, 10, 1000);

const functions = {
    "Goldstein-Price": {
        f: goldsteinPrice,
        fGrad: null,
        fHess: null,
        domain: { x: [-2, 2], y: [-2, 1] },
    },
    "Quadratic": {
        f: (x, y) => quadratic(M, math.matrix([x, y])),
        fGrad: (x, y) => quadraticGradient(M, math.matrix([x, y])),
        fHess: (x, y) => quadraticHessian(M, math.matrix([x, y])),
        domain: { x: [-2, 2], y: [-2, 2] },
    },
    "Rosenbrock": {
        f: (x, y) => {
            const a = 1;
            const b = 100;
            return (a - x) ** 2 + b * (y - x ** 2) ** 2;
        },
        fGrad: null,
        fHess: null,
        domain: { x: [-2, 2], y: [-1, 3] },
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const DIV = "#div-gradient-descent";

    const container = document.querySelector(DIV);

    // Create a wrapper for the title, dropdown, and SVG
    const uiWrapper = document.createElement("div");
    uiWrapper.style.display = "flex";
    uiWrapper.style.flexDirection = "column";
    uiWrapper.style.alignItems = "stretch";

    // Row for title (left) and dropdown (right)
    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.flexDirection = "row";
    topRow.style.alignItems = "center";
    topRow.style.justifyContent = "space-between";
    topRow.style.marginBottom = "8px";

    const title = document.createElement("div");
    title.style.fontSize = "1em";
    title.style.flex = "1 1 auto";
    title.style.textAlign = "left";
    const statusLabel = document.createElement("span");
    statusLabel.textContent = "Status: ";
    const statusValue = document.createElement("span");
    statusValue.textContent = "CONVERGED";
    title.appendChild(statusLabel);
    title.appendChild(statusValue);

    const dropdown = document.createElement("select");
    dropdown.id = "gd-dropdown";
    dropdown.style.fontSize = "1em";
    dropdown.style.padding = "2px 8px";
    dropdown.style.borderRadius = "4px";
    // Style will be set based on theme below
    Object.keys(functions).forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        dropdown.appendChild(option);
    });
    dropdown.style.marginLeft = "16px";

    topRow.appendChild(title);
    topRow.appendChild(dropdown);
    uiWrapper.appendChild(topRow);
    // Insert the wrapper at the top of the container
    container.prepend(uiWrapper);

    const { svg, w, h, m } = window.UTILS.getSVG(DIV, 100);
    svg.append("clipPath")
        .attr("id", "bounding-box-clip")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", w);
    svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", w)
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", 2);

    console.log("whm:", w, h, m);
    dropdown.style.marginRight = `${m}px`;
    title.style.marginLeft = `${m + 5}px`;
    // Move the SVG node into the wrapper, after the top row
    uiWrapper.appendChild(svg.node());

    const svgDomain = { x: [0, w], y: [w, 0] };
    const gridDomain = { x: [0, 250], y: [0, 250] };
    const grid2svg = {
        x: d3.scaleLinear(gridDomain.x, svgDomain.x),
        y: d3.scaleLinear(gridDomain.y, svgDomain.y)
    };

    const transform = ({ type, value, coordinates }) => ({
        type,
        value,
        coordinates: coordinates.map(rings =>
            rings.map(points => points.map(([i, j]) => [grid2svg.x(j), grid2svg.y(i)]))
        )
    });

    const cx = w / 2;
    const cy = h / 2;

    // Throttle utility function
    function throttle(fn, delay) {
        let lastCall = 0;
        let scheduled = null;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                fn.apply(this, args);
            } else if (!scheduled) {
                scheduled = setTimeout(() => {
                    lastCall = Date.now();
                    scheduled = null;
                    fn.apply(this, args);
                }, delay - (now - lastCall));
            }
        };
    }

    // Throttled version of runGradientDescent for dragging
    const throttledRunGradientDescent = throttle(runGradientDescent, 16); // ~60fps

    svg.append("circle")
        .attr("id", "draggable-point")
        .attr("r", 7)
        .attr("fill", "#222")
        .attr("stroke", "#fff")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 2)
        .attr("clip-path", "url(#bounding-box-clip)")
        .attr("cx", cx)
        .attr("cy", cy)
        .style("cursor", "move")
        .call(d3.drag().on("drag", function (event) {
            const px = window.UTILS.clamp(svgDomain.x, event.x);
            const py = window.UTILS.clamp(svgDomain.x, event.y);
            window.GLOBAL_STATE.point.x = window.GLOBAL_STATE.function2svg.x.invert(px);
            window.GLOBAL_STATE.point.y = window.GLOBAL_STATE.function2svg.y.invert(py);
            d3.select(this)
                .attr("cx", px)
                .attr("cy", py);
            throttledRunGradientDescent();
        }));

    function syncContours() {
        window.GLOBAL_STATE.f = functions[dropdown.value].f;
        window.GLOBAL_STATE.function2svg = {
            x: d3.scaleLinear(functions[dropdown.value].domain.x, svgDomain.x),
            y: d3.scaleLinear(functions[dropdown.value].domain.y, svgDomain.y)
        };
        const grid = window.UTILS.generateGrid(window.GLOBAL_STATE.function2svg.x, window.GLOBAL_STATE.function2svg.y, 250, window.GLOBAL_STATE.f);

        const thresholds = window.UTILS.getThresholds(grid, 20, "log");
        const color = d3.scaleSequentialLog(d3.extent(thresholds), d3.interpolateMagma);

        const contoursData = d3.contours()
            .size([250, 250])
            .thresholds(thresholds)(grid)
            .map(transform);

        svg.selectAll(".contour-group").remove();
        const contourGroup = svg.append("g")
            .attr("class", "contour-group")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-opacity", 0.5);
        contourGroup.selectAll("path")
            .data(contoursData)
            .join("path")
            .attr("fill", d => color(d.value))
            .attr("d", d3.geoPath());
        const node = contourGroup.node();
        if (node && node.parentNode.firstChild !== node) {
            node.parentNode.insertBefore(node, node.parentNode.firstChild);
        }

        const draggableCircle = document.getElementById("draggable-point");
        const px = parseFloat(draggableCircle.getAttribute("cx"));
        const py = parseFloat(draggableCircle.getAttribute("cy"));
        window.GLOBAL_STATE.point.x = window.GLOBAL_STATE.function2svg.x.invert(px);
        window.GLOBAL_STATE.point.y = window.GLOBAL_STATE.function2svg.y.invert(py);

        runGradientDescent();
    }

    let trajectory = null;
    let truncated = null;
    let converged = null;

    function runGradientDescent() {
        let [px, py] = [window.GLOBAL_STATE.point.x, window.GLOBAL_STATE.point.y];
        const tol = 1e-6;

        const schedule = window.GLOBAL_STATE.lrSchedule;
        const f = window.GLOBAL_STATE.f;
        const function2svg = window.GLOBAL_STATE.function2svg;
        const domain = functions[dropdown.value].domain;
        const grad = window.GLOBAL_STATE.fGrad || ((x, y) => window.UTILS.finite_differences(x, y, f));

        const xMax = Math.abs(function2svg.x.invert(1e6));
        const yMax = Math.abs(function2svg.y.invert(1e6));

        trajectory = [{ x: px, y: py }];
        truncated = false;
        converged = false;

        for (const lr of schedule) {
            const [gx, gy] = grad(px, py);
            if (math.sqrt(gx * gx + gy * gy) < tol) {
                if (
                    domain.x[0] <= px &&
                    px <= domain.x[1] &&
                    domain.y[0] <= py &&
                    py <= domain.y[1]
                ) {
                    converged = true;
                } else {
                    truncated = true;
                }
                break;
            }

            px -= lr * gx;
            py -= lr * gy;
            if (Math.abs(px) > xMax || Math.abs(py) > yMax) {
                truncated = true;
                break;
            }

            trajectory.push({ x: px, y: py });
            if (truncated) break;
        }

        drawTrajectory();
    }

    function drawTrajectory() {
        svg.selectAll(".gd-path").remove();
        svg.selectAll(".gd-end-marker").remove();

        svg.insert("path", "#draggable-point")
            .datum(trajectory)
            .attr("class", "gd-path")
            .attr("fill", "none")
            .attr("stroke", "#36afff")
            .attr("stroke-width", 2)
            .attr("clip-path", "url(#bounding-box-clip)")
            .attr("d", d3.line()
                .x(d => window.GLOBAL_STATE.function2svg.x(d.x))
                .y(d => window.GLOBAL_STATE.function2svg.y(d.y))
            );

        svg.selectAll(".gd-point")
            .data(trajectory)
            .join("circle")
            .attr("class", "gd-point")
            .attr("r", 2)
            .attr("fill", "#36afff")
            .attr("clip-path", "url(#bounding-box-clip)")
            .attr("cx", d => window.GLOBAL_STATE.function2svg.x(d.x))
            .attr("cy", d => window.GLOBAL_STATE.function2svg.y(d.y));

        if (truncated) {
            statusValue.textContent = "TRUNCATED";
            statusValue.style.color = "rgba(150, 0, 0, 1)";
        } else if (converged) {
            statusValue.textContent = "CONVERGED";
            statusValue.style.color = "rgba(0, 150, 0, 1)";
        } else {
            statusValue.textContent = "NOT CONVERGED";
            statusValue.style.color = "rgba(150, 0, 0, 1)";
        }

        const last = trajectory[trajectory.length - 1];
        const markerWidth = 6;
        if (!truncated) {
            if (converged) {
                svg.append("rect")
                    .attr("class", "gd-end-marker")
                    .attr("x", window.GLOBAL_STATE.function2svg.x(last.x) - markerWidth / 2)
                    .attr("y", window.GLOBAL_STATE.function2svg.y(last.y) - markerWidth / 2)
                    .attr("width", markerWidth)
                    .attr("height", markerWidth)
                    .attr("fill", "#0f0")
                    .attr("stroke", "#222")
                    .attr("stroke-width", 1);
            } else {
                svg.append("rect")
                    .attr("class", "gd-end-marker")
                    .attr("x", window.GLOBAL_STATE.function2svg.x(last.x) - markerWidth / 2)
                    .attr("y", window.GLOBAL_STATE.function2svg.y(last.y) - markerWidth / 2)
                    .attr("width", markerWidth)
                    .attr("height", markerWidth)
                    .attr("fill", "#f00")
                    .attr("stroke", "#222")
                    .attr("stroke-width", 1);
            }
            d3.select("#draggable-point").raise();
        }
    }

    window.addEventListener("lrScheduleChanged", throttledRunGradientDescent);
    dropdown.addEventListener("change", syncContours);
    syncContours();
});
