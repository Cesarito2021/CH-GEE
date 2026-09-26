// Code Editor function example (Earth Engine cloud processing, no app).
// The filename is retained for compatibility. Map display is optional.
// Paste this file after installing the modules, or use dist/Run_Local.js.
var mapper=require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var plots=require('users/calvites1990/CH-GEE_Improved:ForPlots');
var aoi=ee.FeatureCollection('projects/ee-calvites1990/assets/aoi_sardinia_4326'); // Replace with your polygon asset.
var showMap=false; // Set true only if a map preview is wanted.
mapper.runAsync({aoi:aoi,year:2019,predictor_set:'pred2', // pred1 or pred2: input data
model:'RF', // RF, GBM or CART: regression algorithm
numTreesRF:500,mask:'none'},function(result,error){
if(error){print('Unable to complete',error);return;}
var canopyHeight=result.image; // ee.Image at 10 m; use in subsequent analyses or optional exports.
if(showMap){
 Map.centerObject(aoi);
 Map.addLayer(canopyHeight,{min:0,max:30,palette:plots.palettes.Viridis},'Canopy height (m)');
}
print('Evaluation',result.metrics);
print('Testing scatter plot',plots.scatter(result.validation));
print('Variable importance',plots.importance(result.classifier));
});
