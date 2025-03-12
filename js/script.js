const margin = { top: 40, right: 40, bottom: 40, left: 60 };
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const svg = d3
  .select("#vis")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("g").attr("transform", `translate(0,${height})`);

let allData = [];
//let xVar, yVar, sizeVar, targetYear;
let xScale, yScale, sizeScale;
let options = new Set();
const t = 1000; // 1000ms = 1 second
const targetYear = 2010;
let xVar = "year",
  yVar = "district";
const dists = [];
for (let x = 0; x < 30; x++) {
  dists.push(x);
}
const colorScale = d3.scaleOrdinal(dists, d3.schemeSet2);

function init() {
  d3.csv("./data/chicago_crime.csv", (d) => {
    // this is the callback function, applied to each item in the array
    // Besides converting the types, we also simpilify the variable names here.
    const crime = {
      primType: d["Primary Type"],
      description: d.Description,
      arrest: d.Arrest, // using + to convert to numbers; same below
      domestic: d.Domestic,
      district: +d.District,
      ward: +d.Ward,
      year: +d.Year,
    };
    options.add(crime.primType); //Add a new type to our set (doesn't store dupes)

    return crime;
  })
    .then((data) => {
      console.log(options);
      //   console.log(data); // Check the structure in the console
      allData = data;
      allData = data.slice(0, 100);
      console.log(allData);
      setupSelector();

      updateAxes();
      updateVis();
      updateLegend();

      // Initial rendering steps:
    })
    .catch((error) => console.error("Error loading data:", error));
}

window.addEventListener("load", init);

function setupSelector() {
  d3.selectAll(".variable").each(function () {
    d3.select(this)
      .selectAll("myOptions")
      .data([...options])
      .enter()
      .append("option")
      .text((d) => d)
      .attr("value", (d) => d);
  });
  // .on("change", function (event) {
  //   if (d3.select(this).property("id") === "") {
  //     //placeholder, replace with id of our input thingy
  //     yVar = d3.select(this).property("value");
  //   }
  //   updateVis();
  //   updateAxes();
  //   updateLegend(); //if we are implementing a checkbox system
  //   //no need to change axes
  // });
}

function updateAxes() {
  // Draws the x-axis and y-axis
  // Adds ticks, labels, and makes sure everything lines up nicely
  svg.selectAll(".axis").remove();
  svg.selectAll(".labels").remove();
  console.log("updating axes");
  xScale = d3
    .scaleLinear()
    .domain([2000, d3.max(allData, (d) => d[xVar])])
    .range([0, width]);
  const xAxis = d3.axisBottom(xScale);

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`) // Position at the bottom
    .call(xAxis);

  yScale = d3
    .scaleLinear()
    .domain([0, d3.max(allData, (d) => d[yVar])]) // prefined data range
    .range([height, 0]);
  const yAxis = d3.axisLeft(yScale);

  svg.append("g").attr("class", "axis").call(yAxis);

  // X-axis label
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .text(xVar) // Displays the current x-axis variable
    .attr("class", "labels");

  // Y-axis label (rotated)
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .text(yVar) // Displays the current y-axis variable
    .attr("class", "labels");
}

function updateVis() {
  let currentData = allData;
  // .filter((d) => d.year === targetYear)
  // .filter((d) => d.arrest === "true")
  // .filter((d) => d.primType === "BATTERY")
  // .filter((d) => d.ward === 36);
  // console.log(currentData);

  const sumstat = d3.group(allData, (d) => d.primType); // nest function allows to group the calculation per level of a factor
  const color = d3
    .scaleOrdinal()
    .range([
      "#e41a1c",
      "#377eb8",
      "#4daf4a",
      "#984ea3",
      "#ff7f00",
      "#ffff33",
      "#a65628",
      "#f781bf",
      "#999999",
    ]);

    svg
      .selectAll(".line")
      .data(sumstat)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", function (d) {
        return color(d[0]);
      })
      .attr("stroke-width", 1.5)
      .attr("d", function (d) {
        return d3
          .line()
          .x(function (d) {
            return xScale(d.year);
          })
          .y(function (d) {
            return yScale(d.district);
          })(d[1]);
      });

  //   svg
  //     .selectAll(".points")
  //     .data(currentData, (d) => d.District)
  //     .join(
  //       function (enter) {
  //         return enter
  //           .append("circle")
  //           .attr("class", "points")
  //           .attr("cx", (d) => xScale(d[xVar])) // Position on x-axis
  //           .attr("cy", (d) => yScale(d[yVar])) // Position on y-axis
  //           .attr("r", (d) => 10);
  //       },
  //       // Update existing points when data changes
  //       function (update) {
  //         return update
  //           .attr("cx", (d) => xScale(d[xVar]))
  //           .attr("cy", (d) => yScale(d[yVar]))
  //           .attr("r", (d) => 10);
  //       },
  //       // Remove points that no longer exist in the filtered data
  //       function (exit) {
  //         return exit;
  //       }
  //     )
  //     .style("fill", (d) => colorScale(d.continent));
}

//Update legend to match what options are selected
function updateLegend() {}
