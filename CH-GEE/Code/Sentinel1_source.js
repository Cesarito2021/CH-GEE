//***********************************************************************************************
//********************************* Sentinel 1   ************************************************
//***********************************************************************************************
var speckle_filter = require('users/adugnagirma/gee_s1_ard:speckle_filter');
var terrain_flattening = require('users/adugnagirma/gee_s1_ard:terrain_flattening');
var border_noise_correction = require('users/adugnagirma/gee_s1_ard:border_noise_correction');

var to_sentinel_filtered = function(year, start_date,end_date,aoi, mask_raster){
//
var  START_DATE= year+"-"+start_date;
var STOP_DATE= year+"-"+end_date;
      var s1 = ee.ImageCollection('COPERNICUS/S1_GRD_FLOAT')
      .filter(ee.Filter.eq('instrumentMode', 'IW'))
      .filter(ee.Filter.eq('resolution_meters', 10))
      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) // added new1
      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) // added new2
      .filterDate(START_DATE, STOP_DATE)
      .filterBounds(aoi)
      //
      s1 = s1.select(['VV','VH','angle'])
       //
      var S1_1 = s1.map(border_noise_correction.f_mask_edges);
      //
      //
      var s2 = ee.ImageCollection(speckle_filter.MultiTemporal_Filter(S1_1, 
      15, //params.SPECKLE_FILTER_KERNEL_SIZE,
      "GAMMA MAP",//params.SPECKLE_FILTER,
      10 ));
      //
      var s3 = ee.ImageCollection(terrain_flattening.slope_correction(s2,
      'VOLUME', //params.TERRAIN_FLATTENING_MODEL,
      ee.Image('USGS/SRTMGL1_003'),//params.DEM,
      0//params.TERRAIN_FLATTENING_ADDITIONAL_LAYOVER_SHADOW_BUFFER
      )); 
  
    var s4 = s3.map(function(image) {
             return image.clip(aoi)
             .updateMask(mask_raster.eq(1));
             //.updateMask(mask_raster.select(0));
             })
            //
       var composite = ee.Image.cat([
       s3.select('VH').mean(),
       s3.select('VV').mean()
       ]);//.focal_median();
       return(composite)}

exports.to_sentinel_filtered  = to_sentinel_filtered;

//********************************** end **************************************************
