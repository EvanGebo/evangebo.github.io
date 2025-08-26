window.GLOBAL_STATE = window.GLOBAL_STATE || {
    point: { x: 0, y: 0 },
    lrSchedule: []
};
window.CONSTANTS = window.CONSTANTS || {
    width: 500
};

function scheduleExponential(initialLR, decay, maxSteps) {
    return Array.from({length: maxSteps}, (_, step) => initialLR * Math.pow(decay, step));
}

function createSlider({ 
    parent,         // DOM element or selector to insert before/append to
    label,          // Label text
    id,             // Unique id for the slider
    min, max, step, value, // Slider attributes
    format = v => v, // Optional: value formatting function
    oninput         // Callback: function(newValue) { ... }
}) {
    const container = document.createElement("div");
    container.style.marginBottom = "10px";
    container.style.display = "flex";
    container.style.alignItems = "center";

    const labelElem = document.createElement("label");
    labelElem.textContent = label;
    labelElem.style.marginRight = "8px";
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

    return slider; // Return the slider element for further use if needed
}

document.addEventListener("DOMContentLoaded", function() {
    const DIV = "#div-learning-rate";

    // // Create slider for decay rate
    // const sliderContainer = document.createElement("div");
    // sliderContainer.style.marginBottom = "10px";
    // sliderContainer.style.display = "flex";
    // sliderContainer.style.alignItems = "center";

    // const label = document.createElement("label");
    // label.textContent = "Decay rate: ";
    // label.style.marginRight = "8px";
    // label.htmlFor = "decay-slider";

    // const slider = document.createElement("input");
    // slider.type = "range";
    // slider.min = "0.95";
    // slider.max = "1.0";
    // slider.step = "0.0005";
    // slider.value = "0.999";
    // slider.id = "decay-slider";
    // slider.style.flex = "1";

    // const valueDisplay = document.createElement("span");
    // valueDisplay.textContent = slider.value;

    // slider.oninput = function() {
    //     valueDisplay.textContent = parseFloat(this.value).toFixed(3);
    //     window.GLOBAL_STATE.lrSchedule = scheduleExponential(0.0001, parseFloat(this.value), 1000);
    //     window.dispatchEvent(new Event("lrScheduleChanged"));

    //     // Redraw the line
    //     d3.select(DIV).select("svg").selectAll("path").remove();
    //     d3.select(DIV).select("svg")
    //         .append("path")
    //         .datum(window.GLOBAL_STATE.lrSchedule)
    //         .attr("fill", "none")
    //         .attr("stroke", "#36afff")
    //         .attr("stroke-width", 2)
    //         .attr("d", d3.line()
    //             .x((_, i) => x(i))
    //             .y(d => y(d))
    //         );
    // };

    // sliderContainer.appendChild(label);
    // sliderContainer.appendChild(slider);
    // sliderContainer.appendChild(valueDisplay);

    // const divLearningRate = document.querySelector(DIV);
    // divLearningRate.parentNode.insertBefore(sliderContainer, divLearningRate);
    createSlider({
        parent: DIV,
        label: "Decay Rate:",
        id: "decay-slider",
        min: 0.95,
        max: 1.0,
        step: 0.0005,
        value: 0.999,
        format: v => parseFloat(v).toFixed(3),
        onInput: function(value) {
            window.GLOBAL_STATE.lrSchedule = scheduleExponential(0.0001, value, 1000);
            window.dispatchEvent(new Event("lrScheduleChanged"));
        }
    });
    window.GLOBAL_STATE.lrSchedule = scheduleExponential(0.0001, 0.999, 1000);

    const height = 100, margin = {left: 0, right: 0, top: 20, bottom: 30};
    const svg = d3.select(DIV)
        .append("svg")
        .attr("viewBox", [0, 0, window.CONSTANTS.width, height])
        .style("width", "100%")
        .style("height", "100%");

    const lrSchedule = window.GLOBAL_STATE.lrSchedule;
    const x = d3.scaleLinear()
        .domain([0, lrSchedule.length - 1])
        .range([margin.left, window.CONSTANTS.width - margin.right]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(lrSchedule)])
        .range([height - margin.bottom, margin.top]);

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(10));
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5));
    
    svg.selectAll(".y.axis").remove();
    svg.selectAll("g")
        .filter(function() {
            // Remove the y axis group (axisLeft)
            return d3.select(this).attr("transform") === `translate(${margin.left},0)`;
        })
        .remove();

    svg.append("path")
        .datum(lrSchedule)
        .attr("fill", "none")
        .attr("stroke", "#36afff")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x((_, i) => x(i))
            .y(d => y(d))
        );

    // // Label
    // svg.append("text")
    //     .attr("x", width / 2)
    //     .attr("y", margin.top)
    //     .attr("text-anchor", "middle")
    //     .attr("font-size", 14)
    //     .attr("fill", "#222")
    //     .text("Learning Rate Schedule");
});
