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

function getSVG(div, height, topMargin, bottomMargin, debug = false) {
    const innerWidth = document.querySelector(".column-body").offsetWidth;
    const fullWidth = document.querySelector(".column-body-outset").offsetWidth;
    const w = innerWidth;
    const h = innerWidth * height / 100;
    const mt = innerWidth * topMargin / 100;
    const mb = innerWidth * bottomMargin / 100;
    const mh = (fullWidth - innerWidth) / 2;
    const svg = d3.select(div)
        .append("svg")
        .attr("viewBox", [-mh, -mt, fullWidth, h + mt + mb])
        .attr("display", "block")
        .style("width", `${fullWidth}px`)
        .style("height", `${h + mt + mb}px`);
    
    if (debug) {
        console.log("div:               ", div);
        console.log("inner width:       ", innerWidth);
        console.log("full width:        ", fullWidth);
        console.log("horizontal margin: ", mh);
        console.log("top margin:        ", mt);
        console.log("bottom margin:     ", mb);
        svg.append("rect")
            .attr("x", -mh)
            .attr("y", -mt)
            .attr("width", w + 2*mh)
            .attr("height", h + mt + mb)
            .attr("fill", "none")
            .attr("stroke", "black");
        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", w)
            .attr("height", h)
            .attr("fill", "none")
            .attr("stroke", "black");
    }

    return { svg, w, h, mh, mt, mb };
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

const katexCache = new Map();

function renderKaTeX(tex, node, fontSize = 14) {
    if (!katexCache.has(tex)) {
        const tmp = document.createElement("div");
        katex.render(tex, tmp, { throwOnError: false });
        katexCache.set(tex, tmp.innerHTML);
    }
    node.innerHTML = katexCache.get(tex);
    node.style.fontSize = `${fontSize}px`;
}

function katexFO(parent, { x=0, y=0, tex="", anchor="start", fontSize=14 } = {}) {
    const fo = parent.append("foreignObject")
        .attr("x", x)
        .attr("y", y)
        .attr("width", 1)
        .attr("height", 1)
        .attr("class", "katex-fo");
    const div = fo.append("xhtml:div")
        .style("display", "inline-block")
        .style("line-height", "1");
    renderKaTeX(tex, div.node(), fontSize);
    const {width, height} = div.node().getBoundingClientRect();
    fo.attr("width", width).attr("height", height);
    const dx = (anchor === "middle") ? -width/2 : (anchor === "end") ? -width : 0;
    const dy = -height/2;
    console.log(x, y, width, height, dx, dy);
    fo.attr("transform", `translate(${dx}, ${dy})`);
    return fo;
}

window.UTILS = {
    rotationMatrix,
    psdMatrix,
    getSVG,
    linspace,
    getThresholds,
    finite_differences,
    clamp,
    generateGrid,
    katexFO
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
