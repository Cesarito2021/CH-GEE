# Canopy Height Mapper - Google Earth Engine
## User Interface  
![Suppl_fig1B](https://github.com/user-attachments/assets/2f464c28-896a-486c-b065-e944dd9e086d)
## Overview
The Canopy Height Mapper is a Google Earth Engine 🌎⛰️🌳🌲web application (CH-GEE) combining Global Ecosystem Dynamics Investigation (GEDI) data with Sentinel 1/2 and topographical data. 
The GEDI mission can monitor nearest Earth's forests through widespread laser shots of ~25 m of diameters (between 51.6° N and >51.6° S). 

### Accessing the Canopy Height Google Earth Engine App
To access the Canopy Height Google Earth Engine App, click [here](https://ee-calvites1990.projects.earthengine.app/view/ch-gee).
For a detailed description of the procedure and to view the repository, you can visit the project on GitHub [here](https://github.com/Cesarito2021/CH-GEE.git). on GitHub here.


## Vision
The vision of the CH-GEE web app is to be the leading platform for accessing high-resolution Canopy Height maps of Earth's forests. We aim to empower individuals, organisations, and researchers worldwide with the tools and data they need to make informed decisions, protect forests, and address critical environmental challenges.

## Developers
1. Alvites Cesar
2. Bazzato Erika
3. O'Sullivan Hannah
4. Francini Saverio

## Acknowledgment
This GEE application was initially conceived during the 2nd edition Google Earth Engine Summer School organized by the Laboratory of Forest Geomatics, University of florence (September).

# CH-GEE web application configuration
# Spatial extent setting
## *Input/Output options*
Area of Interest (AOI) definition: Users can define the AOI by either 1) drawing it manually or 2) uploading a polygon in format Shapefile. For projection details, users can refer to the official GEE guide.
## *Toggle Forest Mask* 
Users can select one of the three options for forest masks available in the CH-GEE web app: 1.Forest mask available at "GOOGLE/DYNAMICWORLD/V1" and 2. Forest mask available at "JAXA/ALOS/PALSAR/YEARLY/FNF". In contrast, the "exclude forest mask" option will assume that the full AOI is covered by forest.
# Data setting
## *Select GEDI Rh relative height metric*
Users can select between 1) single GEDI Relative Height (Rh; m) metric ranging from 1% to 100%, or 2) The average GEDI Rh metric among 75%, 90%, 95%, and 100%.
## *Temporal extent setting for GEDI footprints collection*
Specify the start and end dates (Year/Month/Day) for GEDI collections to access data based on the specified period. 
## *Temporal extent setting for Sentinel 1/2 collection* 
Specify the start and end dates (Year/Month/Day) for the Sentinel 1/2 collection to access data based on the specified period. The cloud coverage threshold for Sentinel-2 pixels is set at 70%, as this is widely recognized as a practical limit for ensuring accurate pixel-wise analyses 
# Model parameter setting
## *Select and set Machine Learning (ML) algorithm*
Users can select one of the three ML option: 1) Random Forests (RF), 2) Gradient Tree Boosting (GB), and 3) Classification and Regression Trees (CART). Hyperparameters for RF include the number of decision trees (numberOfTrees), variables per split (variablesPerSplit), minimum training samples in each leaf node (minLeafPopulation), input fraction for bagging per tree (bagFraction), and maximum leaf nodes per tree (maxNodes). For GB, parameters encompass the number of decision trees (numberOfTrees), learning rate (shrinkage), sampling rate for stochastic tree boosting (samplingRate), maximum leaf nodes per tree (maxNodes), and loss function for regression (loss). CART parameters include maximum leaf nodes per tree (maxNodes) and minimum training samples in each leaf node (minLeafPopulation).
# Download setting
## *Download Canopy Height Map* 
Users need to customize the desired folder and file name using the “Download Canopy Height Map” button in the CH-GEE app.
## *Run CH-GEE*
Run the CH-GEE web app using the selected parameters for the defined study area. Users can automatically generate a Canopy Height map, along with scatter plots and variable importance graphs. To visualize the R-squared values, users can hover over the function formula
## *Run CH-GEE*
Clear previously set parameters and study area configurations.







