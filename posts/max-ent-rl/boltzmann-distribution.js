{
const DIV = "#div-boltzmann-distribution";

const { svg, w, h, mh, mt, mb } = window.UTILS.getSVG(DIV, 30, 1, 7, false);

const data = [
    { label: String.raw`Q^{\pi_\text{old}}(a_1, s)`, newLabel: String.raw`\pi_\text{new}(a_1 \;|\; s)`, value: .30 },
    { label: String.raw`Q^{\pi_\text{old}}(a_2, s)`, newLabel: String.raw`\pi_\text{new}(a_2 \;|\; s)`, value: .80 },
    { label: String.raw`Q^{\pi_\text{old}}(a_3, s)`, newLabel: String.raw`\pi_\text{new}(a_3 \;|\; s)`, value: .45 },
    { label: String.raw`Q^{\pi_\text{old}}(a_4, s)`, newLabel: String.raw`\pi_\text{new}(a_4 \;|\; s)`, value: .60 }
];

const xQ = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, 0.45*w])
    .padding(0.1);

const xPi = d3.scaleBand()
    .domain(data.map(d => d.newLabel))
    .range([0, 0.45*w])
    .padding(0.1);

const y = d3.scaleLinear()
    .domain([0, 1])
    .nice()
    .range([h, 0]);

const gQ = svg.append("g")
    .attr("class", "gQ");
const gPi = svg.append("g")
    .attr("class", "gPi")
    .attr("transform", `translate(${0.55 * w}, 0)`);

const barsQ = gQ.selectAll(".bar.q")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar q")
    .attr("x", d => xQ(d.label))
    .attr("y", d => y(d.value))
    .attr("width", xQ.bandwidth())
    .attr("height", d => h - y(d.value))
    .attr("fill", "steelblue")
    .style("cursor", "ns-resize")
    .call(d3.drag()
        .on("drag", function(event, d) {
            d.value = Math.min(1, Math.max(0.05, y.invert(event.y)));
            d3.select(this)
            .attr("y", y(d.value))
            .attr("height", h - y(d.value));
        updatePiBars();
    })
);

let alpha = 1.0;

function getPiData() {
    const exp = data.map(d => Math.exp(d.value * 10 / alpha));
    const sumExp = exp.reduce((a, b) => a + b, 0);
    return data.map((d, i) => ({ label: d.newLabel, value: exp[i] / sumExp }));
}

const barsPi = gPi.selectAll(".bar.pi")
    .data(getPiData())
    .enter()
    .append("rect")
    .attr("class", "bar pi")
    .attr("x", d => xPi(d.label))
    .attr("y", d => y(d.value))
    .attr("width", xPi.bandwidth())
    .attr("height", d => h - y(d.value))
    .attr("fill", "orange");

function updatePiBars() {
    barsPi.data(getPiData())
        .attr("y", d => y(d.value))
        .attr("height", d => h - y(d.value));
}

svg.append("text")
    .attr("x", 0.45 * w / 2)
    .attr("y", h + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "15px")
    .attr("font-family", "inherit")
    .attr("fill", "inherit")
    .text("Action-Value Functions");

svg.append("text")
    .attr("x", 1.55 * w / 2)
    .attr("y", h + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "15px")
    .attr("font-family", "inherit")
    .attr("fill", "inherit")
    .text("Induced Boltzmann Distribution");

const gQAxis = gQ.append("g")
    .attr("transform", `translate(0, ${h})`);
gQAxis.call(d3.axisBottom(xQ));
gQAxis.selectAll(".tick")
    .each(function(d) {
        const tick = d3.select(this);
        tick.selectAll("text").remove();
        window.UTILS.katexFO(tick, { x: 0, y: 15, tex: d, anchor: "middle", fontSize: 12 });
    });

const gPiAxis = gPi.append("g")
    .attr("transform", `translate(0, ${h})`);
gPiAxis.call(d3.axisBottom(xPi));
gPiAxis.selectAll(".tick")
    .each(function(d) {
        const tick = d3.select(this);
        tick.selectAll("text").remove();
        window.UTILS.katexFO(tick, { x: 0, y: 15, tex: d, anchor: "middle", fontSize: 12 });
    });

// Create a slider for scaling the Q-values
const sliderContainer = document.createElement("div");
sliderContainer.style.marginBottom = "20px";
sliderContainer.style.textAlign = "center";
sliderContainer.style.display = "block";
sliderContainer.style.clear = "both";

// Create label+value row
const labelRow = document.createElement("div");
labelRow.style.textAlign = "center";
labelRow.style.marginBottom = "4px";
labelRow.style.fontSize = "15px";

const sliderLabel = document.createElement("span");
sliderLabel.textContent = "Alpha: 10";
sliderLabel.style.marginRight = "4px";

const sliderValue = document.createElement("sup");
sliderValue.textContent = "1.00";
sliderValue.style.fontWeight = "bold";
sliderValue.style.marginLeft = "-4px";
sliderValue.style.verticalAlign = "middle";

labelRow.appendChild(sliderLabel);
labelRow.appendChild(sliderValue);
sliderContainer.appendChild(labelRow);

// Create slider row
const slider = document.createElement("input");
slider.type = "range";
slider.min = "-1";
slider.max = "3";
slider.value = "0";
slider.step = "0.01";
slider.style.width = "80%";

slider.oninput = function () {
    sliderValue.textContent = slider.value;
    alpha = 10 ** parseFloat(slider.value);
    sliderValue.textContent = parseFloat(slider.value).toFixed(2);
    updatePiBars();
};

sliderContainer.appendChild(slider);
document.querySelector(DIV).appendChild(sliderContainer);
}
