const margin = {top: 40, right: 40, bottom: 40, left: 60};
const width = 800 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;


const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);


svg.append('g')
    .attr('transform', `translate(0,${height})`);

let allData = [];


let xScale = d3.scaleLinear()
    .domain([2001, 2025])
    .range([0, width]);

let yScale = d3.scaleLinear()
    .domain([0, 500000])
    .range([height, 0]);
let options = new Set(["ALL"]);
const crimeCounts = {};
const t = 1000; // 1000ms = 1 second


function init(){
    d3.csv("./data/chicago_crime.csv", d => { 
    // this is the callback function, applied to each item in the array
        // Besides converting the types, we also simpilify the variable names here. 
        const crime = {
            primType: d["Primary Type"],
            description: d.Description,
            arrest: d.Arrest, // using + to convert to numbers; same below
            domestic: d.Domestic, 
            district: +d.District, 
            ward: +d.Ward, 
            year: +d.Year
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
    .then(data => {
            console.log(options)
            console.log(crimeCounts) // Check the structure in the console
            allData = data
            setupSelector()
            
            // Initial rendering steps: Set up fixed axes
            

            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(xScale).ticks(12));
            //axes lables
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + margin.bottom - 5)
                .attr("text-anchor", "middle")
                .text("Year") // Displays the current x-axis variable
                .attr('class', 'labels');

            
            
            svg.append("g")
                .call(d3.axisLeft(yScale));
            //axes labels THIS ONE IS A LIL WONKY
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -margin.left + 15)
                .attr("text-anchor", "middle")
                .text("Reports") // Displays the current y-axis variable
                .attr('class', 'labels');
            updateVis();
        })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);
//ChatGPT generated 37 distinct hexadecimal colors
const colorScale = d3.scaleOrdinal([...options],
    ["#ff7f0e", "#000000", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2",
    "#7f7f7f", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78", "#98df8a", "#ff9896",
    "#c5b0d5", "#c49c94", "#f7b6d2", "#c7c7c7", "#dbdb8d", "#9edae5", "#393b79",
    "#637939", "#8c6d31", "#843c39", "#7b4173", "#5254a3", "#6b6ecf", "#b5cf6b",
    "#e7ba52", "#e7969c", "#31a354", "#756bb1", "#636363", "#d6616b", "#ce6dbd",
    "#e6550d"]
    );


function setupSelector() {
    d3.selectAll('.variable')
        .each(function() {
            d3.select(this).selectAll('myOptions')
            .data([...options])
            .enter()
            .append('option')
            .text(d => d)
            .attr("value", d=>d)
        })

        //TODO

        .on("change", function (event) {
            if(d3.select(this).property("id") === "") { //placeholder, replace with id of our input thingy
                yVar = d3.select(this).property("value");
            }
            
            updateLegend();
        });

}

const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.count));


function updateVis() {
    const formatted = Object.entries(crimeCounts).flatMap(([year, crimes]) => 
        Object.entries(crimes).map(([primType, count]) => ({
            year: +year,
            primType,
            count
        }))
    );
    
    console.log(formatted);


    [...options].forEach((crime, i) => {
        svg.append("path")
        .datum(formatted.filter(d => d.primType === crime))
        .attr("fill", "none")
        .attr("stroke", colorScale(i))
        .attr("stroke-width", 2)
        .attr("d", line)
    });
}

//Update legend to match what options are selected
function updateLegend() {

}