## collision_toronto
# Toronto Collision Data Web Map
### Project Overview
This project is an interactive web map that visualizes traffic collisions that happened to cyclists and pedestrain in Toronto. It aggregates collision incidents into hexagonal bins using Turf.js and Mapbox GL JS, allowing users to analyze the spatial distribution of traffic collisions and their contributing factors, such as over speeding, red light, alcohol, and illustrate the amount of injuries that are pedestrian and cyclist. 

### Key Features
- Hexagonal Binning – Aggregates collision data into 0.5 km hexagons.
- Collision Cause Analysis – Counts incidents caused by speeding, red-light violations, alcohol, cyclist, and pedestrian involvement.
- Interactive Pop-ups – Click on a hexagon to view collision statistics.
- Layer Toggle Controls – Enable/disable collision points and hexgrid layers.
- Bounding Box Visualization – Displays the area covered by collision data.
- Color-Coded Hexagons – Intensity represents collision count (higher = darker).

### Data Source
The collision data is sourced from the Toronto Open Data Portal, which provides publicly available transportation datasets. The dataset includes collision reports from 2006 to 2021, detailing location, cause, and involvement type (e.g., cyclist, pedestrian).
- Dataset: Toronto Pedestrian & Cyclist Collision Data (2006-2021)
- GeoJSON Format: The data is processed and stored in a GeoJSON format