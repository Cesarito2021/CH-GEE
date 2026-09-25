// Code Editor function only: export tasks are not available in the viewing app.
var mapper=require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var downloads=require('users/calvites1990/CH-GEE_Improved:ForUploadDownload');
var aoi=ee.FeatureCollection('projects/ee-calvites1990/assets/aoi_sardinia_4326'); // Replace with your own asset.
mapper.runAsync({aoi:aoi,year:2019,predictor_model:'model3',model:'RF',numTreesRF:500,mask:'none'},function(result,error){
if(error){print('Unable to complete',error);return;}
print('Evaluation',result.metrics);
// Creates tasks. Start them explicitly in the Tasks tab.
downloads.toDrive(result,{description:'CH_GEE_Improved_Pred3_2019',folder:'CH_GEE',scale:10});
});
