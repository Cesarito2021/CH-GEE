// Code Editor function only: export tasks are not available in the viewing app.
var mapper=require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var downloads=require('users/calvites1990/CH-GEE_Improved:ForUploadDownload');
var plots=require('users/calvites1990/CH-GEE_Improved:ForPlots');
var aoi=ee.FeatureCollection('projects/ee-calvites1990/assets/aoi_sardinia_4326'); // Replace with your own asset.
// Both end dates are exclusive. GEDI may span several years.
// Optional land cover: mask:'DW', maskClasses:[1,5], maskYear:2019.
// predictor_set: pred1/pred2 input data. model: RF/GBM/CART regression algorithm.
var options={aoi:aoi,predictor_set:'pred2',model:'RF',numTreesRF:500,
 start_date:'2019-04-01',end_date:'2019-09-30',
 startDateGEDI:'2019-01-01',endDateGEDI:'2020-12-31',
 quantile:'rh95',gedi_type:'singleGEDI',beams:'all',acquisition:'all',mask:'none'};
mapper.runAsync(options,function(result,error){
if(error){print('Unable to complete',error);return;}
print('Evaluation',result.metrics);
Map.centerObject(aoi);
result.validation.aggregate_max('classification').evaluate(function(max,error){
 if(error){print(error);return;}
 Map.addLayer(result.image,{min:0,max:Math.max(5,Math.ceil(max/5)*5),palette:plots.palettes.Viridis},'Canopy height (m)');
});
print('Testing scatter plot',plots.scatter(result.validation));
print('Variable importance',plots.importance(result.classifier));
// Creates tasks. Start them explicitly in the Tasks tab.
downloads.toDrive(result,{description:'CH_GEE_Improved_Pred2_2019',folder:'CH_GEE',scale:10});
});
