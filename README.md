# Canopy Height Mapper - Google Earth Engine

## CH-GEE Improved — new single-map version

The separate [Improved release](Improved/README.md) adds three predictor sets:
the original Sentinel-1/2 + GMTED workflow, Sentinel-1/2 + Copernicus terrain +
coordinates, and annual AlphaEarth + terrain + coordinates. The latter two
use buffered sampling and training-only mean-importance selection. The single-map
UI retains the CH-GEE colours and expandable sections. Downloads are available
through the functions, not through the viewing UI. This release excludes conformal.

Start with [account access, AOI setup and the new function](Improved/README.md).
Open the [Improved Earth Engine scripts](https://code.earthengine.google.com/?accept_repo=users/calvites1990/CH-GEE_Improved)
if shared with you, or paste [the standalone app](Improved/dist/CH-GEE.js) into a new Code Editor script.
The existing published app linked below remains the original version.

```javascript
var mapper = require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var aoi = ee.FeatureCollection('projects/your-project/assets/your-aoi');
mapper.runAsync({aoi:aoi, year:2019, predictor_model:'model3', model:'RF',
  numTreesRF:500}, function(result,error) {
  if (error) { print(error); return; }
  Map.centerObject(aoi);
  Map.addLayer(result.image, {min:0,max:30,
    palette:['440154','443983','31688e','21918c','35b779','90d743','fde725']},
    'Canopy height (m)');
  print('Evaluation', result.metrics);
});
```

See [Run_And_Export.js](Improved/Run_And_Export.js) for optional 10 m Drive tasks.

### Python and incoming updates

The [Python function and setup instructions](Improved/python/README.md) are included.
Python runs the same shared Earth Engine main and returns maps, evaluation and
predictor importance; it launches no app. A small local Node.js dependency keeps
the implementation shared. A fully native Python translation is a future update,
subject to numerical verification. See [release verification](Improved/validation/VERIFICATION.md)
for tested behavior and limitations.

## User Interface
![Image](https://github.com/user-attachments/assets/ee1e953b-e45a-46e5-a793-dab78453429c)
## Background and Access
Accessing the Canopy Height Google Earth Engine App to access the CH-GEE app click on [CH-GEE App](https://ee-calvites1990.projects.earthengine.app/view/ch-gee).
To export large CH-GEE maps, users can compute GEE code accessed on [CH-GEE Code](https://code.earthengine.google.com/?accept_repo=users/calvites1990/CH-GEE). 
To understand how to use the GEE web app, please check the tutorial video accessed via the [CH-GEE tutorial video](https://www.youtube.com/watch?v=0FkrbyENeB4).

## Overview
The Canopy Height Mapper is a Google Earth Engine 🌎⛰️🌳🌲web application (CH-GEE) combining Global Ecosystem Dynamics Investigation (GEDI) data with Sentinel 1/2 and topographical data. 
The GEDI mission can monitor nearest Earth's forests through widespread laser shots of ~25 m of diameters (between 51.6° N and >51.6° S). 

## Vision
The vision of the CH-GEE web app is to be the leading platform for accessing high-resolution Canopy Height maps of Earth's forests. We aim to empower individuals, organisations, and researchers worldwide with the tools and data they need to make informed decisions, protect forests, and address critical environmental challenges.

## Tutorial — original published version
Note: if the area of interest is larger than 10,000 grid dimension and the GeoTIFF file exceeds 32 MB, please follow this code:

### Step 1: Setting the CH-GEE function
```javascript
// ***************** Run CH-GEE code ***********************
var aoi = yourAOI; // Define your area of interest

// Import the CH-GEE library
var library = require("users/calvites1990/CH-GEE:CH-GEE_main");

// Configure the CanopyHeightMapper function
var CH_GEE = library.CanopyHeightMapper(
  aoi,          // Area of Interest (AOI)
  2019,         // YYYY - Sentinel collection year
  "06-01",      // MM-DD of start Sentinel collection
  "08-31",      // MM-DD of end Sentinel collection
  "2019-01-01", // YYYY-MM-DD of start GEDI collection
  "2020-01-01", // YYYY-MM-DD of end GEDI collection
  70,           // Cloud coverage percentage ("70")
  "rh95",       // GEDI metric, e.g., "rh95"
  "RF",         // Model type: "RF" (Random Forest), "GBM" (Gradient Boosting Machine), or "CART" (Classification and Regression Trees)
  "FNF",        // Forest mask: "FNF" or "DW"
  "singleGEDI", // GEDI processing type: "SingleGEDI" or "meanGEDI"
  500,          // Number of trees in Random Forest model (NumTreesRF)
  5,            // Split ratio in Random Forest model (varSplitRF)
  1,            // Minimum leaf population in Random Forest model (minLeafPopuRF)
  0.5,          // Bagging fraction in Random Forest model (bagFracRF)
  5,            // Maximum number of nodes in Random Forest model (maxNodesRF)
  "null",       // Number of trees in GBM model (numTreesGBM)
  "null",       // Shrinkage rate in GBM model (shrGBM)
  "null",       // Learning rate in GBM model (samLingRateGBM)
  "null",       // Maximum number of nodes in GBM model (maxNodesGBM)
  "null",       // Loss function in GBM model (lossGBM)
  "null",       // Maximum number of nodes in CART model (maxNodesCART)
  "null"        // Minimum leaf population in CART model (minLeafPopCART)
);

// ***************** Zoom to CH-GEE map *****************    
Map.centerObject(aoi, 14);
// ******************************************************
```
### Step 2: Export the generated CH-GEE map

```javascript
// ***************** Export CH-GEE code ***********************
var CHMap = ee.Image(ee.List(CH_GEE).get(0))
Export.image.toDrive({
image:CHMap,
description: "CHMap",
folder: "ee_drive",
region: aoi,
scale:10,
maxPixels:1e13,
crs:"EPSG:4325"
})
// ***************** End ***********************
```
## Reference
#### CH-GEE performance assessment at local scale 
Alvites, C., O’Sullivan, H., Francini, S., Marchetti, M., Santopuoli, G., Chirici, G., ... & Bazzato, E. (2024). High-Resolution Canopy Height Mapping: Integrating NASA’s Global Ecosystem Dynamics Investigation (GEDI) with Multi-Source Remote Sensing Data. Remote Sensing, 16(7), 1281.

#### CH-GEE performance assessment at regional and national scale
Alvites, C., O'Sullivan, H., Francini, S., Marchetti, M., Santopuoli, G., Chirici, G., ... & Bazzato, E. (2025). Canopy height Mapper: A google earth engine application for predicting global canopy heights combining GEDI with multi-source data. Environmental Modelling & Software, 183, 106268.
## Developers
1. Alvites Cesar
2. Bazzato Erika
3. O'Sullivan Hannah
4. Francini Saverio

## Acknowledgment
This GEE application was initially conceived during the 2nd edition Google Earth Engine Summer School organized by the Laboratory of Forest Geomatics, University of florence (September).

# CH-GEE web application configuration
## Input/Output options
Area of Interest (AOI) definition: Users can define the AOI by either 1) drawing it manually or 2) uploading a polygon in format Shapefile. For projection details, users can refer to the official GEE guide.
## Choose Forest Mask 
Users can select one of the three options for forest masks available in the CH-GEE web app: 1.Forest mask available at "GOOGLE/DYNAMICWORLD/V1" and 2. Forest mask available at "JAXA/ALOS/PALSAR/YEARLY/FNF". In contrast, the CH-GEE will assume that the full AOI is covered by forest.
## Choose GEDI Canopy Heights 
Users can select between 1) single GEDI Relative Height (Rh; m) metric ranging from 1% to 100%, or 2) The average GEDI Rh metric among 75%, 90%, 95%, and 100%.
## Choose Machine Learning (ML) Algorithm
Users can pick from 1) Random Forests (RF), 2) Gradient Tree Boosting (GB), and 3) Classification and Regression Trees (CART). Hyperparameters for RF include the number of decision trees (numberOfTrees), variables per split (variablesPerSplit), minimum training samples in each leaf node (minLeafPopulation), input fraction for bagging per tree (bagFraction), and maximum leaf nodes per tree (maxNodes). For GB, parameters encompass the number of decision trees (numberOfTrees), learning rate (shrinkage), sampling rate for stochastic tree boosting (samplingRate), maximum leaf nodes per tree (maxNodes), and loss function for regression (loss). CART parameters include maximum leaf nodes per tree (maxNodes) and minimum training samples in each leaf node (minLeafPopulation).
## Set period for Sentinel 1/2 collection 
Specify the start and end dates (Year/Month/Day) for the Sentinel 1/2 time series used for Canopy Height mapping.
## Set Cloud Coverage Percentage for Sentinel-2
Users can set the maximum acceptable percentage of cloud cover in Sentinel-2 images using a scoring function.
## Download Canopy Height Map 
Configure Google Drive folder settings and specify the image name (.GeoTIFF) for saving tree height map images.
## Run CH-GEE
Compute the CH-GEE web app with the selected parameters for the defined study area. Users can then automatically generate a Canopy Height map along with corresponding scatter plots and variable importance graphs.
## Run CH-GEE
Clear previously set parameters and study area configurations.







