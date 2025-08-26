const width = 400, height = 400, margin = 40;

// Equilateral triangle vertices (centered horizontally, flat base at bottom)
// Compute side length and height for equilateral triangle
const side = width - 2 * margin;
const triHeight = side * Math.sqrt(3) / 2;
const centerX = width / 2;
const baseY = height - margin;
// Vertices: top, bottom left, bottom right
const vA = [centerX, baseY - triHeight];
const vB = [centerX - side / 2, baseY];
const vC = [centerX + side / 2, baseY];

const EPS = 1e-6;

/**
 * Convert barycentric (x, y, 1 - x - y) coordinates to Cartesian (x, y) coordinates.
 * @param {*} x
 * @param {*} y
 * @returns 
 */
function barycentricToCartesian(x, y) {
    let z = 1 - x - y;
    return [
        x * vA[0] + y * vB[0] + z * vC[0],
        x * vA[1] + y * vB[1] + z * vC[1]
    ];
}

/**
 * Convert Cartesian (x, y) coordinates to barycentric (x, y, 1 - x - y) coordinates.
 * @param {*} px 
 * @param {*} py 
 * @returns 
 */
function cartesianToBarycentric(px, py) {
    let x1 = vA[0], y1 = vA[1];
    let x2 = vB[0], y2 = vB[1];
    let x3 = vC[0], y3 = vC[1];
    let detT = (y2 - y3)*(x1 - x3) + (x3 - x2)*(y1 - y3);
    let l1 = ((y2 - y3)*(px - x3) + (x3 - x2)*(py - y3)) / detT;
    let l2 = ((y3 - y1)*(px - x3) + (x1 - x3)*(py - y3)) / detT;
    return [l1, l2];
}

/**
 * Check if a point is inside the probability simplex.
 * @param {*} x 
 * @param {*} y 
 * @returns 
 */
function isValidPolicy(x, y) {
    return x >= -EPS && y >= -EPS && (x + y) <= 1 + EPS && (1 - x - y) >= -EPS;
}

/**
 * Compute the Kullback-Leibler divergence KL(p || q) for 3-armed bandit simplex.
 * @param {*} p 
 * @param {*} q 
 * @returns 
 */
function klDivergence(p, q) {
    let kl = 0;
    for (let i = 0; i < 3; ++i) {
        let pi = Math.max(p[i], EPS);
        let qi = Math.max(q[i], EPS);
        kl += pi * (Math.log(pi) - Math.log(qi));
    }
    return kl;
}

document.addEventListener("DOMContentLoaded", function() {
    let labelDiv;
    function updateLabel() {
        let x = point.x.toFixed(2);
        let y = point.y.toFixed(2);
        let z = Math.abs(1 - point.x - point.y).toFixed(2);
        if (labelDiv) {
            let latex = `\\(\\pi = (${x},\\;${y},\\;${z})\\)`;
            labelDiv.html(latex);
            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise([labelDiv.node()]);
            }
        }
    }

    let point = { x: 0.33, y: 0.33 };

    // Wrap SVG and canvas in a relative div for proper stacking
    const container = d3.select("#d3-demo")
        .style("position", "relative")
        .style("width", width + "px")
        .style("height", height + "px");

    // After container is created, add the label div
    labelDiv = container .append("div")
        .attr("id", "coord-label")
        .style("position", "absolute")
        .style("left", (width + 20) + "px")
        .style("top", margin + "px")
        .style("font-size", "1.2em");
    updateLabel();

    // Add canvas first (background)
    const canvas = container.append("canvas")
        .attr("id", "contour-canvas")
        .attr("width", width)
        .attr("height", height)
        .style("position", "absolute")
        .style("left", "0px")
        .style("top", "0px")
        .style("z-index", 0);

    // Add SVG on top
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("position", "absolute")
        .style("left", "0px")
        .style("top", "0px")
        .style("z-index", 1);

    svg.append("polygon")
        .attr("points", [
            vA.join(","),
            vB.join(","),
            vC.join(",")
        ].join(" "))
        .attr("fill", "none")
        .attr("stroke", "#333")
        .attr("stroke-width", 2);

    const ctx = canvas.node().getContext("2d");

    function drawCanvas() {
        ctx.clearRect(0, 0, width, height);
        let img = ctx.createImageData(width, height);
        const q = [point.x, point.y, 1 - point.x - point.y];
        const maxKL = 2.5;
        for (let py = 0; py < height; ++py) {
            for (let px = 0; px < width; ++px) {
                const [x, y] = cartesianToBarycentric(px, py);
                if (isValidPolicy(x, y)) {
                    const kl = klDivergence([x, y, 1 - x - y], q);
                    const color = d3.rgb(d3.interpolateViridis(1 - Math.min(kl, maxKL) / maxKL));
                    const idx = 4 * (py * width + px);
                    img.data[idx] = color.r;
                    img.data[idx + 1] = color.g;
                    img.data[idx + 2] = color.b;
                    img.data[idx + 3] = 255;
                }
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    drawCanvas();

    const drag = d3.drag()
        .on("drag", function (event) {
            let [mx, my] = cartesianToBarycentric(event.x, event.y);
            // Project to simplex (clip to triangle)
            mx = Math.max(0, Math.min(1, mx));
            my = Math.max(0, Math.min(1, my));
            if (mx + my > 1) {
                const s = (mx + my - 1) / 2;
                mx -= s;
                my -= s;
            }

            point.x = mx;
            point.y = my;

            let [cx, cy] = barycentricToCartesian(point.x, point.y);
            d3.select(this)
                .attr("cx", cx)
                .attr("cy", cy);
            drawCanvas();
            updateLabel();
        });

    let [cx, cy] = barycentricToCartesian(point.x, point.y);
    svg.append("circle")
        .attr("r", 10)
        .attr("fill", "crimson")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .attr("cx", cx)
        .attr("cy", cy)
        .style("cursor", "move")
        .call(drag);
});

// TODO: https://observablehq.com/@d3/animated-contours
