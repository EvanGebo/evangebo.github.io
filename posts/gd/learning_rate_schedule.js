function scheduleExponential(initialLR, decay, maxSteps) {
    return Array.from({length: maxSteps}, (_, step) => initialLR * Math.pow(decay, step));
}

function createSlider({ 
    parent,
    label,
    id,
    min, max, step, value,
    format,
    oninput
}) {
    const container = document.createElement("div");
    container.style.marginBottom = "10px";
    container.style.display = "flex";
    container.style.alignItems = "center";

    const labelElem = document.createElement("label");
    labelElem.style.marginRight = "8px";
    labelElem.textContent = label;
    labelElem.htmlFor = id;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.id = id;
    slider.style.flex = "1";

    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = format(value);

    slider.oninput = function() {
        valueDisplay.textContent = format(this.value);
        if (oninput) oninput(parseFloat(this.value));
    };

    container.appendChild(labelElem);
    container.appendChild(slider);
    container.appendChild(valueDisplay);

    if (typeof parent === "string") {
        document.querySelector(parent).parentNode.insertBefore(container, document.querySelector(parent));
    } else {
        parent.appendChild(container);
    }

    return slider;
}

document.addEventListener("DOMContentLoaded", function() {
    const DIV = "#div-learning-rate";

    function redrawLearningRateGraph() {
        d3.select(DIV).select("svg").selectAll("path").remove();
        d3.select(DIV).select("svg")
            .append("path")
            .datum(window.GLOBAL_STATE.lrSchedule)
            .attr("fill", "none")
            .attr("stroke", "#36afff")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x((_, i) => x(i))
                .y(d => y(d))
            );
    }
    window.GLOBAL_STATE.lrSchedule = scheduleExponential(0.0001, 0.999, 5000);

    // const innerWidth = document.querySelector(DIV).parentElement.parentElement.offsetWidth;

    // const svg = d3.select(DIV)
    //     .append("svg")
    //     .attr("viewBox", [0 - outerMargin * ratio, 0, w, height])
    //     .style("width", "100%")
    //     .style("height", "100%");

    const height = 25;
    const { svg, w, h } = getSVG(DIV, height);
    const margin = { left: 0, right: 0, top: 0.1, bottom: 0.1 };

    // svg.append("rect")
    //     .attr("x", 0)
    //     .attr("y", 0)
    //     .attr("width", w)
    //     .attr("height", h)
    //     .attr("fill", "#f0f0f0");

    const x = d3.scaleLinear()
        .domain([0, window.GLOBAL_STATE.lrSchedule.length - 1])
        .range([0, w]);

    // Add axis label for the x-axis
    svg.append("text")
        .attr("x", w / 2)
        .attr("y", h + 30)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#222")
        .text("Steps");
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(window.GLOBAL_STATE.lrSchedule)])
        .range([h - margin.bottom * h, margin.top * h]);

    // Draw horizontal axis line
    svg.append("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", h - margin.bottom * h)
        .attr("y2", h - margin.bottom * h)
        .attr("stroke", "#222")
        .attr("stroke-width", 1);

    xAxis = g => g
        .attr("transform", `translate(0,${h - margin.bottom * h})`)
        .call(d3.axisBottom(x).ticks(10))
        .call(g => g.append("text")
            .attr("x", w)
            .attr("y", margin.bottom * h - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text("Timestep →"));
    
    yAxis = g => g
        .attr("transform", `translate(0,0)`)
        .call(d3.axisLeft(y).ticks(5))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "middle")
            .text("↑ Learning Rate"));
    
    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // Add light gray horizontal grid lines at the tick marks
    svg.append("g")
        .attr("class", "grid-lines")
        .selectAll("line")
        .data(y.ticks(5))
        .join("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5);
    
    // svg.append("g")
    //     .attr("transform", `translate(0,0)`)
    //     .call(d3.axisLeft(y).ticks(5));

    // svg.append("g")
    //     .attr("transform", `translate(0,${height - margin.bottom})`)
    //     .call(d3.axisBottom(x).ticks(10));
    // svg.append("g")
    //     .attr("transform", `translate(${margin.left},0)`)
    //     .call(d3.axisLeft(y).ticks(5));
    
    // svg.selectAll(".y.axis").remove();
    // svg.selectAll("g")
    //     .filter(function() {
    //         return d3.select(this).attr("transform") === `translate(${margin.left},0)`;
    //     })
    //     .remove();

    window.addEventListener("lrScheduleChanged", redrawLearningRateGraph);
    window.dispatchEvent(new Event("lrScheduleChanged"));
});
