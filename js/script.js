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
let formatted;
let colorScale;
const line = d3
  .line()
  .x((d) => xScale(d.year))
  .y((d) => yScale(d.count));

let xScale = d3.scaleLinear().domain([2001, 2025]).range([0, width]);

let yScale = d3.scaleLinear().domain([0, 500000]).range([height, 0]);

let options = new Set(["ALL"]);
const crimeCounts = {};
let yVar = "ALL"; //maybe turn this into an array to read multiple values
const t = 1000; // 1000ms = 1 second
let selectedTypes = options;

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
    //Need to store each year and what crimes occured on those years
    if (!crimeCounts[crime.year]) {
      crimeCounts[crime.year] = {};
      crimeCounts[crime.year]["ALL"] = 0;
    }
    if (!crimeCounts[crime.year][crime.primType]) {
      crimeCounts[crime.year][crime.primType] = 0;
    }
    //increment for current year and type
    crimeCounts[crime.year][crime.primType]++;
    crimeCounts[crime.year]["ALL"]++;

    return crime;
  })
    .then((data) => {
      console.log(options);
      console.log(crimeCounts); // Check the structure in the console
      formatted = Object.entries(crimeCounts).flatMap(([year, crimes]) =>
        Object.entries(crimes).map(([primType, count]) => ({
          year: +year,
          primType,
          count,
        }))
      ); //Format data to be passed into d3
      console.log(formatted);

      colorScale = d3.scaleOrdinal(
        [...options],
        [
          "#000000",
          "#ff7f0e",
          "#2ca02c",
          "#d62728",
          "#9467bd",
          "#8c564b",
          "#e377c2",
          "#7f7f7f",
          "#bcbd22",
          "#17becf",
          "#aec7e8",
          "#ffbb78",
          "#98df8a",
          "#ff9896",
          "#c5b0d5",
          "#c49c94",
          "#f7b6d2",
          "#c7c7c7",
          "#dbdb8d",
          "#9edae5",
          "#393b79",
          "#637939",
          "#8c6d31",
          "#843c39",
          "#7b4173",
          "#5254a3",
          "#6b6ecf",
          "#b5cf6b",
          "#e7ba52",
          "#e7969c",
          "#31a354",
          "#756bb1",
          "#636363",
          "#d6616b",
          "#ce6dbd",
          "#e6550d",
        ]
      );

      allData = data;
      selectedTypes = options;

      setupSelector();
      // Initial rendering steps:
      updateAxes();
      updateVis();
      updateLegend();
    })
    .catch((error) => console.error("Error loading data:", error));
}

window.addEventListener("load", init);
//ChatGPT generated 37 distinct hexadecimal colors

function setupSelector() {
  d3.selectAll(".variable")
    .each(function () {
      d3.select(this)
        .selectAll("myOptions")
        .data([...options])
        .enter()
        .append("option")
        .text((d) => d)
        .attr("value", (d) => d);
    })

    //TODO

    .on("change", function (event) {
      if (d3.select(this).property("id") === "") {
        //placeholder, replace with id of our input thingy
        yVar = d3.select(this).property("value");
      }
      updateAxes();
      updateVis();
      updateLegend();
    });

  const parent = document.getElementById("checkboxes");
  let i = 1;

  for (let type of options) {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "checkbox" + i;
    checkbox.value = type;
    checkbox.id = "checkbox" + i;
    checkbox.className = "checkbox";
    checkbox.checked = true;
    // creating label for checkbox
    let label = document.createElement("label");
    // assigning attributes for the created label tag
    label.htmlFor = "checkbox" + i;
    label.appendChild(document.createTextNode(type));

    parent.appendChild(checkbox);
    parent.appendChild(label);
    //d3.select("#checkbox" + i).on("change", updateCheckboxes());
    i += 1;
  }

  d3.selectAll(".checkbox").on("change", function () {
    if (this.checked) {
      console.log("You checked the checkbox:");
      console.log(this.value);

      selectedTypes.add(this.value);
      if (this.value == "ALL") {
        yVar = "ALL";
      }
    } else {
      console.log("You unchecked the checkbox:");
      console.log(this.value);
      selectedTypes.delete(this.value);
      if (this.value == "ALL") {
        yVar = "SELECTED";
      }
    }

    updateAxes();
    updateVis();
    updateLegend();
  });
}

function updateAxes() {
  svg.selectAll(".axis").remove();
  svg.selectAll(".labels").remove();

  //fixed x axis
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(12))
    .attr("class", "axis");

  //axes lables
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("Year") // Displays the current x-axis variable
    .attr("class", "labels");

  //Change y axis scale from 500k to 100k if all is not selected
  yScale = d3
    .scaleLinear()
    .domain([0, yVar === "ALL" ? 500000 : 100000])
    .range([height, 0]);

  const yAxis = d3.axisLeft(yScale);
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,0)`)
    .call(yAxis);

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Reports")
    .attr("class", "labels");
}

function updateVis() {
  //Iterate through each crime type in the list and draw a line
  //TODO iterate through crimes selected
  svg.selectAll(".lines").remove();

  [...selectedTypes].forEach((crime) => {
    svg
      .append("path")
      .datum(formatted.filter((d) => d.primType === crime))
      .attr("fill", "none")
      .attr("stroke", colorScale(crime))
      .attr("stroke-width", 2)
      .attr("class", "lines")
      .attr("d", line);
  });

  //   let tmp = [];
  //   selectedTypes.forEach((crime) => tmp.push({ primType: crime }));
  //   console.log(formatted.filter((d) => d.primType === "BATTERY"));
  //   let currentData = formatted.filter((d) => d.primType in selectedTypes);
  //   console.log(selectedTypes);

  //   //   let idk = new Map();
  //   //   selectedTypes.forEach((crime) => idk.set(crime, []));
  //   //   formatted.forEach((entry) => {
  //   //     idk
  //   //       .get(entry.primType)
  //   //       .push({ year: formatted[entry.year], count: formatted[entry.count] });
  //   //   });

  //   svg
  //     .selectAll("path")
  //     .data([...selectedTypes])
  //     .join(
  //       // When we have new data points
  //       function (enter) {
  //         console.log(enter);
  //         return enter
  //           .append("path")
  //           .datum((d) => formatted.filter((e) => e.primType === d))
  //           .attr("fill", "none")
  //           .attr(
  //             "stroke",
  //             colorScale((d) => d)
  //           )
  //           .attr("stroke-width", 2)
  //           .attr("d", line)

  //           .on("mouseover", function (event, d) {})
  //           .on("mouseout", function (event, d) {});
  //       },
  //       // Update existing points when data changes
  //       function (update) {
  //         return update;
  //       },
  //       // Remove points that no longer exist in the filtered data
  //       function (exit) {
  //         exit.transition(t).remove(); // Then remove the bubble
  //       }
  //     );
  // .style("fill", (d) => colorScale(d.continent))
  // .style("opacity", 0.5); // Slight transparency for better visibility;
}

//Update legend to match what options are selected
function updateLegend() {
  svg.selectAll(".crimeSquare").remove();
  svg.selectAll(".crimeName").remove();

  let size = 10;
  svg
    .selectAll("crimeSquare")
    .data([...selectedTypes])
    .enter()
    .append("rect")
    .attr("y", (d, i) => i * (size + 10) - 30)
    .attr("x", 600)
    .attr("width", 10)
    .attr("height", 10)
    .attr("class", "crimeSquare")
    .style("fill", (d) => colorScale(d));

  svg
    .selectAll("crimeName")
    .data([...selectedTypes])
    .enter()
    .append("text")
    .attr("y", (d, i) => i * (size + 10) + size - 30)
    .attr("x", 600 + size)
    .style("fill", (d) => colorScale(d))
    .text((d) => d)
    .attr("text-anchor", "left")
    .attr("class", "crimeName")
    .style("font-size", "13px");
}
