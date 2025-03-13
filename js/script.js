const margin = { top: 40, right: 40, bottom: 40, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 650 - margin.top - margin.bottom;

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

let xScale = d3
  .scaleLinear()
  .domain([2001, 2025])
  .range([0, width - 170]);

let yScale = d3.scaleLinear().domain([0, 500000]).range([height, 0]);
let ymax = 0;

let options = new Set(["ALL"]);
const crimeCounts = {};
let yVar = "ALL"; //maybe turn this into an array to read multiple values
const t = 1000; // 1000ms = 1 second
let selectedTypes = options;

const allColors = [
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
];

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

      colorScale = d3.scaleOrdinal([...options], [...allColors]);

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
  var r = document.querySelector(":root");

  //   for (let x = 1; x <= allColors.length; x++) {
  //     r.style.setProperty("--custom-color" + x, allColors[x - 1]);
  //   }
  const lst = [...options];

  for (let i = 1; i <= lst.length; i++) {
    //type of options) {
    let checkbox = document.createElement("input");
    r.style.setProperty("--curr-color", allColors[i - 1]);
    checkbox.type = "checkbox";
    checkbox.name = "checkbox" + i;
    checkbox.value = lst[i - 1]; // type;
    checkbox.id = "checkbox" + i;
    checkbox.className = "checkbox";
    checkbox.checked = true;
    // creating label for checkbox
    let label = document.createElement("label");
    // assigning attributes for the created label tag
    label.htmlFor = "checkbox" + i;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(lst[i - 1]));

    parent.appendChild(label);
    //d3.select("#checkbox" + i).on("change", updateCheckboxes());
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
    .attr("x", (width - 150) / 2)
    .attr("y", height + margin.bottom - 5)
    .attr("text-anchor", "middle")
    .text("Year") // Displays the current x-axis variable
    .attr("class", "labels");

  //Change y axis scale from 500k to 100k if all is not selected

  ymax = 0;
  for (let x of formatted) {
    if (selectedTypes.has(x.primType) && x.count > ymax) {
      ymax = x.count;
    }
  }

  yScale = d3
    .scaleLinear()
    .domain([0, yVar === "ALL" ? 500000 : ymax])
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
      .attr("d", line)
      .attr("pointer-events", "visibleStroke")
      .on("mouseover", function (mouse) {
        const [x_cord, y_cord] = d3.pointer(mouse);
        const xratio = x_cord / (width - 170);
        const yratio = y_cord / height;
        const current_year = 2001 + Math.round(xratio * (2025 - 2001));
        const current_count = ymax - Math.round(yratio * ymax);
        d3.select("#tooltip")
          // if you change opacity to hide it, you should also change opacity here
          .style("display", "block") // Make the tooltip visible
          .html(
            // Change the html content of the <div> directly
            `<strong>${current_year}</strong><br/>
        Count: ${current_count}`
          )
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY - 28 + "px");

        // d3.select(this)
        //   .style("fill", d3.select(this).attr("stroke"))
        //   .attr("fill-opacity", 0.3);

        d3.select(this).style("stroke-width", "4px");
      })
      .on("mouseout", function (d) {
        d3.select("#tooltip").style("display", "none"); // Hide tooltip when cursor leaves
        d3.select(this)
          .style("fill", "none")
          .attr("fill-opacity", 1)
          .style("stroke-width", "2px");
      });
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

  let names = [...selectedTypes];
  console.log(names);
  for (let i = 0; i < names.length; i++) {
    if (names[i].length > 20) {
      names[i] = names[i].substring(0, 20) + "...";
      console.log(names[i]);
    }
  }

  let size = 7;
  svg
    .selectAll("crimeSquare")
    .data([...selectedTypes])
    .enter()
    .append("rect")
    .attr("y", (d, i) => i * (size + 7) - 25)
    .attr("x", 550)
    .attr("width", 7)
    .attr("height", 7)
    .attr("class", "crimeSquare")
    .style("fill", (d) => colorScale(d));

  svg
    .selectAll("crimeName")
    .data([...names])
    .enter()
    .append("text")
    .attr("y", (d, i) => i * (size + 7) + size - 25)
    .attr("x", 550 + size)
    .style("fill", (d) => colorScale(d))
    .text((d) => d)
    .attr("text-anchor", "left")
    .attr("class", "crimeName")
    .style("font-size", "11px");
}
