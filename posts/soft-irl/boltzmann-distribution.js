document.addEventListener("DOMContentLoaded", function() {
    const DIV = "#div-boltzmann-distribution";
    // Ensure the container has enough space for slider and SVG
    const container = document.querySelector(DIV);
    // if (container) {
    //     container.style.minHeight = "calc(100% + 60px)";
    //     container.style.paddingBottom = "60px";
    //     container.style.overflow = "visible";
    // }

    const { svg, w, h, mh, mt, mb } = window.UTILS.getSVG(DIV, 30, 1, 7, true);

    const data = [
        { label: "Q(a₁, s)", newLabel: "π(a₁ | s)", value: .30 },
        { label: "Q(a₂, s)", newLabel: "π(a₂ | s)", value: .80 },
        { label: "Q(a₃, s)", newLabel: "π(a₃ | s)", value: .45 },
        { label: "Q(a₄, s)", newLabel: "π(a₄ | s)", value: .60 },
        { label: "Q(a₅, s)", newLabel: "π(a₅ | s)", value: .20 }
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

        svg.append("g")
            .attr("transform", `translate(0, ${h})`)
            .call(d3.axisBottom(xQ)
                .tickFormat(label => {
                    // Convert Q(a₁, s) to LaTeX string
                    // Replace Unicode subscript with _{i}
                    const latex = label.replace(/Q\(a([₁₂₃₄₅]), s\)/, (m, i) => {
                        const sub = { '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5' }[i];
                        return `Q(a_{${sub}}, s)`;
                    });
                    return `$${latex}$`;
                })
            );

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

    // Add Pi axis
    gPi.append("g")
        .attr("transform", `translate(0, ${h})`)
        .call(d3.axisBottom(xPi)
            .tickFormat(label => {
                // Convert π(a₁ | s) to LaTeX string
                const latex = label.replace(/π\(a([₁₂₃₄₅]) \| s\)/, (m, i) => {
                    const sub = { '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5' }[i];
                    return `\\pi(a_{${sub}} \mid s)`;
                });
                return `$${latex}$`;
            })
        );

    svg.append("text")
        .attr("x", 1.55 * w / 2)
        .attr("y", h + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-family", "inherit")
        .attr("fill", "inherit")
        .text("Induced Boltzmann Distribution");

    // Render MathJax SVG for label
    const tex = window.MathJax.tex2svg("\\text{Softmax Policy }\\pi", { display: false });
    const texSVG = tex.querySelector('svg');
    if (texSVG) {
        // Set SVG attributes for positioning and style
        texSVG.setAttribute('x', (0.45 * w / 2).toString());
        texSVG.setAttribute('y', (h + 40).toString());
        texSVG.setAttribute('width', '300');
        texSVG.setAttribute('height', '30');
        texSVG.setAttribute('style', 'display: block; margin: 0 auto;');
        // Convert SVG to string and add to main SVG using foreignObject
        const foreign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        foreign.setAttribute('x', (0.45 * w / 2 - 150).toString());
        foreign.setAttribute('y', (h + 20).toString());
        foreign.setAttribute('width', '300');
        foreign.setAttribute('height', '30');
        foreign.appendChild(texSVG);
        svg.node().appendChild(foreign);
    }

    // Create a slider for scaling the Q-values
    const sliderContainer = document.createElement("div");
    sliderContainer.style.marginBottom = "20px";
    sliderContainer.style.textAlign = "center";
    sliderContainer.style.display = "block";
    sliderContainer.style.clear = "both";

    const sliderLabel = document.createElement("label");
    sliderLabel.textContent = "Alpha: ";
    sliderLabel.style.marginRight = "10px";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0.1";
    slider.max = "10";
    slider.value = "1";
    slider.step = "0.1";

    const sliderValue = document.createElement("span");
    sliderValue.textContent = slider.value;

    slider.oninput = function () {
        sliderValue.textContent = slider.value;
        alpha = parseFloat(slider.value);
        updatePiBars();
    };

    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(sliderValue);
    document.querySelector(DIV).appendChild(sliderContainer);
});
