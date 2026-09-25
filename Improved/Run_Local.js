// Paste this file after installing the modules, or use dist/Run_Local.js.
var mapper=require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var plots=require('users/calvites1990/CH-GEE_Improved:ForPlots');
var aoi=ee.FeatureCollection('projects/ee-calvites1990/assets/aoi_sardinia_4326'); // Replace with your polygon asset.
mapper.runAsync({aoi:aoi,year:2019,predictor_model:'model3',model:'RF',numTreesRF:500,mask:'none'},function(result,error){
if(error){print('Unable to complete',error);return;}
Map.centerObject(aoi);
Map.addLayer(result.image,{min:0,max:30,palette:plots.palettes.Viridis},'Canopy height (m)');
print('Evaluation',result.metrics);
print('Testing scatter plot',plots.scatter(result.validation));
print('Variable importance',plots.importance(result.classifier));
});
