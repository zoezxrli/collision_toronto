/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiem9lemh1b2xpIiwiYSI6ImNtN3R6bDFybzE0N3EybG9pdTJhbWhjdWIifQ.F2uw6Wdnx7123MgeohvncQ'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/zoezhuoli/cm8drczsu00fj01s56ymqb6qt',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 11 // starting zoom level
});


/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable
// Step 2: Fetch collision data and store it in a variable
let collisionData; // Empty variable to store data

fetch("https://raw.githubusercontent.com/zoezxrli/collision_toronto/main/pedcyc_collision_06-21.geojson") 
    .then(response => response.json())  // Convert response to JSON
    .then(data => {
        collisionData = data;
        console.log("Collision Data Loaded:", collisionData); // Verify in console
    })
    .catch(error => console.error("Error loading data:", error));


/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function
//      **Option: You may want to consider how to increase the size of your bbox to enable greater geog coverage of your hexgrid
//                Consider return types from different turf functions and required argument types carefully here
map.on("load", function () {
    if (!collisionData) {
        console.error("Collision data not loaded yet!");
        return;
    }

    // Add collision data as a source
    map.addSource("collisions", {
        type: "geojson",
        data: collisionData
    });

    // Display collision points
    map.addLayer({
        id: "collision-points",
        type: "circle",
        source: "collisions",
        paint: {
            "circle-radius": 5,
            "circle-color": "#ff0000",
            "circle-opacity": 0.7
        }
    });

    // Create a bounding box around the collision data
    let bbox = turf.bbox(collisionData);
    console.log("Bounding Box:", bbox);

    // Expand the bounding box slightly for better coverage
    let expandedBbox = turf.transformScale(turf.bboxPolygon(bbox), 1.1);
    let expandedCoords = turf.bbox(expandedBbox);

    // Generate a hexagonal grid
    let hexgrid = turf.hexGrid(expandedCoords, 0.5, { units: "kilometers" });
    console.log("Hexgrid Created:", hexgrid);

    // Add hexgrid to the map
    map.addSource("hexgrid", {
        type: "geojson",
        data: hexgrid
    });

    map.addLayer({
        id: "hex-layer",
        type: "fill",
        source: "hexgrid",
        paint: {
            "fill-color": "#088",
            "fill-opacity": 0.4,
            "fill-outline-color": "#000"
        }
    });
});

/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


