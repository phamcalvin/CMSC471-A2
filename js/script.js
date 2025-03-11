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
//let xVar, yVar, sizeVar, targetYear;
let xScale, yScale, sizeScale;




const t = 1000; // 1000ms = 1 second

function init(){
    d3.csv("./data/chicago_crime.csv", d => ({ 
    // this is the callback function, applied to each item in the array

        // Besides converting the types, we also simpilify the variable names here. 
        primType: d["Primary Type"],
        description: d.Description,
        arrest: d.Arrest, // using + to convert to numbers; same below
        domestic: d.Domestic, 
        district: +d.District, 
        ward: +d.Ward, 
        year: +d.Year,
       
    }))
    .then(data => {
            console.log(data) // Check the structure in the console
            allData = data
            
            
            // Initial rendering steps:
            
        })
    .catch(error => console.error('Error loading data:', error));
}

window.addEventListener('load', init);
