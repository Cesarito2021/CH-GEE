//***********************************************************************************************
//************************** Canopy Height Mapper GEE web app   *********************************
*************************************************************************************************

readme
CH-GEE (Canopy Height Mapper) 
The Canopy Height Mapper is a Google Earth Engine (CH-GEE) web app designed to predict canopy heights by integrating GEDI (Global Ecosystem Dynamics Investigation) RH metrics with Sentinel-1/2 data and topographical variables. This folder contains the JavaScript files necessary for the functioning of the CH-GEE app.
Files in the Folder:
1.	CH-GEE_main.js
This script is the main file that executes the entire app. It coordinates the interaction between various modules and scripts, allowing the canopy height prediction process to run automatically and rapidly.
2.	CH-GEE_UI.js
This file contains the User Interface (UI) code for the CH-GEE app. It allows users to interact with the app, including uploading data, visualizing results, setting parameters and temporal extents, and accessing different analysis tools.
3.	ForForestMasking.js
This script allow for masking forest areas, ensuring that only relevant regions are included in the analysis.
4.	ForPlots.js
This file generates the plots for visualizing the results, including accuracy assessments, variable importance, and scatter plots.
5.	ForUploadDownload.js
This script allows users to upload their area of interest (AOI) in shapefile format. It also handles the downloading of generated canopy height maps in GeoTIFF format.
6.	L2A_GEDI_source.js
This script is responsible for accessing and handling  and pre-processing the GEDI L2A data, which contains the canopy height footprints collected by NASA's GEDI mission.
7.	RandomSampling.js
This script is used for random sampling, particularly for larger areas exceeding 4000 km², to manage computational load and ensure efficient processing.
8.	Sentinel1_source.js
This file contains code for accessing and processing Sentinel-1 data, which provides radar data used in the analysis.
9.	Sentinel2_source.js
This script is responsible for accessing and processing Sentinel-2 data, providing optical remote sensing data useful for canopy height estimation.

Workflow Overview:
First to all, users need to define the area of interest (by drawing an AOI or uploading an AOI shapefile), select one of the three forest mask options, choose one GEDI RH metric to use as a proxy for canopy height, and set the temporal extent for the GEDI RH metric, as well as the temporal extents for Sentinel-1 and Sentinel-2. Next, users should select one of the three machine learning algorithms and specify the folder path and name for transferring the Geo TIFF to their personal drive. Finally, users need to click 'Run' again. After this, users can automatically view the map, scatter plot, and variable importance graphs.

