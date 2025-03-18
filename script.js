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
let hexgrid; // Empty variable for hexgrid

// fetch collision data from the provided GeoJSON URL
fetch("https://raw.githubusercontent.com/zoezxrli/collision_toronto/main/pedcyc_collision_06-21.geojson") 
    .then(response => response.json())  
    .then(data => {
        collisionData = data;
        console.log("Collision Data Loaded:", collisionData);

        // load data
        map.on("load", function () {
            addCollisionData();
            createHexgrid();
        });
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
function addCollisionData() {
    if (!collisionData || !collisionData.features) {
        console.error("Collision data not available!");
        return;
    }

    console.log("Adding collision data to map...");

    // add collision data source
    if (map.getSource("collisions")) {
        map.removeSource("collisions");
    }
    map.addSource("collisions", {
        type: "geojson",
        data: collisionData
    });

    // add collision points layer
    if (map.getLayer("collision-points")) {
        map.removeLayer("collision-points");
    }
    map.addLayer({
        id: "collision-points",
        type: "circle",
        source: "collisions",
        paint: {
            "circle-radius": 3,
            "circle-color": "#2c3e50",
            "circle-opacity": 0.7
        }
    });
}
/*--------------------------------------------------------------------
Step 3 & 4: CREATE BOUNDING BOX, HEXGRID, AND AGGREGATE COLLISIONS
--------------------------------------------------------------------*/
function createHexgrid() {
    if (!collisionData || !collisionData.features) {
        console.error("Collision data not available!");
        return;
    }

    console.log("Creating bounding box, hexgrid, and aggregating data...");

    // generate bounding box using turf.envelope() (Feature Polygon)
    // this method creates the smallest rectangle that contains all collision points.
    let envelopeBBox = turf.envelope(collisionData);
    console.log("Envelope Bounding Box:", envelopeBBox);

    // extract bounding coordinates as an array [minX, minY, maxX, maxY]
    let bbox = turf.bbox(envelopeBBox);
    console.log("Bounding Box Coordinates:", bbox);

    // wrap bounding box in a FeatureCollection (for addSource method)
    let bboxGeoJSON = {
        "type": "FeatureCollection",
        "features": [envelopeBBox]
    };
    console.log("Bounding Box FeatureCollection:", bboxGeoJSON);

    // expand bounding box by 10% for better coverage
    let expandedBBox = turf.transformScale(envelopeBBox, 1.1);
    let expandedCoords = turf.bbox(expandedBBox);

    // generate a hex grid inside the expanded bounding box (0.5 km hexagons)
    hexgrid = turf.hexGrid(expandedCoords, 0.5, { units: "kilometers" });
    console.log("Hexgrid Created:", hexgrid);

    // aggregate collision data using Turf collect() to count unique IDs inside each hexagon
    let collishex = turf.collect(hexgrid, collisionData, '_id', 'values');

    // loop through hexagons to count values and find max collision count
    let maxCollisions = 0;
    collishex.features.forEach((feature) => {
        // Initialize counts for different collision causes
        let collisions = feature.properties.values.length || 0;
        let speeding = 0;
        let redlight = 0;
        let alcohol = 0;
        let cyclist = 0;
        let pedestrian = 0;

        // iterate through each collision point in this hexagon
        feature.properties.values.forEach(id => {
            let collision = collisionData.features.find(d => d.properties._id === id);
            if (collision) {
                // count the number of collisions caused by different factors
                if (collision.properties.SPEEDING === "Yes") speeding++;
                if (collision.properties.REDLIGHT === "Yes") redlight++;
                if (collision.properties.ALCOHOL === "Yes") alcohol++;
                if (collision.properties.INVTYPE === "Cyclist") cyclist++;
                if (collision.properties.INVTYPE === "Pedestrian") pedestrian++;
            }
        });

        // store computed values
        feature.properties.collision_count = collisions;
        feature.properties.speeding_count = speeding;
        feature.properties.redlight_count = redlight;
        feature.properties.alcohol_count = alcohol;
        feature.properties.cyclist_count = cyclist;
        feature.properties.pedestrian_count = pedestrian;

        // update max collision count
        if (collisions > maxCollisions) {
            maxCollisions = collisions;
        }
    });

    console.log("Aggregated Hexgrid with Full Counts:", collishex);
    console.log("Max Collisions in a Hexagon:", maxCollisions);

    // add bounding box to Mapbox (for visualization)
    if (map.getSource("bounding-box")) {
        map.removeSource("bounding-box");
    }
    map.addSource("bounding-box", {
        type: "geojson",
        data: bboxGeoJSON
    });

    // add bounding box as a layer (for debugging)
    if (map.getLayer("bbox-layer")) {
        map.removeLayer("bbox-layer");
    }
    map.addLayer({
        id: "bbox-layer",
        type: "line",
        source: "bounding-box",
        paint: {
            "line-color": "#ff0000",
            "line-width": 2,
            "line-opacity": 0.8
        }
    });

    // add hexgrid to Mapbox
    if (map.getSource("hexgrid")) {
        map.removeSource("hexgrid");
    }
    map.addSource("hexgrid", {
        type: "geojson",
        data: collishex
    });

    // style hexagons based on collision count
    if (map.getLayer("hex-layer")) {
        map.removeLayer("hex-layer");
    }
    map.addLayer({
        id: "hex-layer",
        type: "fill",
        source: "hexgrid",
        paint: {
            "fill-color": [
                "interpolate",
                ["linear"],
                ["get", "collision_count"],
                0, "#fcf3cf",   // color for 0 collisions
                5, "#E64A19",   // color for 5+ collisions
                10, "#C2185B",  // color for 10+ collisions
                20, "#880E4F",  // color for 20+ collisions
                50, "#4A0839"   // color for highest collision density
            ],
            "fill-opacity": [
                "case",
                ["==", ["get", "collision_count"], 0], 0, // hide empty hexagons
                0.8 // opacity for visible hexagons to see the points distribute across toronto
            ],
            "fill-outline-color": "#000"
        }
    });
    console.log("✅ Hexgrid and Bounding Box added to the map!");
}

// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows
map.on("click", "hex-layer", function (e) {
    let properties = e.features[0].properties;

    // check what properties exist
    console.log("Clicked Hexagon Properties:", properties);

    // check if properties exist (avoid undefined errors)
    if (!properties) {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>No collisions recorded for this hexagon.</strong>`)
            .addTo(map);
        return;
    }

    // directly access properties from the object
    let popupContent = `
        <strong>Collision Count:</strong> ${properties.collision_count ?? 0}<br>
        <strong>Caused by Speeding:</strong> ${properties.speeding_count ?? 0}<br>
        <strong>Caused by RedLight:</strong> ${properties.redlight_count ?? 0}<br>
        <strong>Caused by Alcohol:</strong> ${properties.alcohol_count ?? 0}<br>
        <strong>Cyclists Injury:</strong> ${properties.cyclist_count ?? 0}<br>
        <strong>Pedestrians :</strong> ${properties.pedestrian_count ?? 0}
    `;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
});

document.getElementById("toggle-collisions").addEventListener("change", function () {
    map.setLayoutProperty("collision-points", "visibility", this.checked ? "visible" : "none");
});

document.getElementById("toggle-hexgrid").addEventListener("change", function () {
    map.setLayoutProperty("hex-layer", "visibility", this.checked ? "visible" : "none");
});

// change cursor to pointer when hovering over hexagons
map.on("mouseenter", "hex-layer", function () {
    map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "hex-layer", function () {
    map.getCanvas().style.cursor = "";
});