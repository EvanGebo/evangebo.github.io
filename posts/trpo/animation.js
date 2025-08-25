let data = [10, 15, 20, 25, 30];
const width = 200, height = 100;

const svg = d3.select("#d3-demo")
	.append("svg")
	.attr("width", width)
	.attr("height", height);

function updateChart() {
	const bars = svg.selectAll("rect")
		.data(data);

	// ENTER
	bars.enter()
		.append("rect")
		.attr("x", (d, i) => i * 40)
		.attr("width", 30)
		.attr("fill", "steelblue")
		.attr("y", height)
		.attr("height", 0)
		.merge(bars)
		.on("click", function(event, d, i) {
			// d is the datum, i is the index in D3 v7
			const idx = typeof i === 'number' ? i : data.indexOf(d);
			data[idx] += 5;
			updateChart();
		})
		.transition()
		.duration(400)
		.attr("x", (d, i) => i * 40)
		.attr("y", d => height - d * 3)
		.attr("height", d => d * 3);

	// EXIT
	bars.exit().remove();
}

updateChart();