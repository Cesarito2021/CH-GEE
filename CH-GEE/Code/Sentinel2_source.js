//***********************************************************************************************
//*************************************** Sentinel 2   ******************************************
//***********************************************************************************************
 
 var calculateCompositeClip = function(year, startDate, endDate, cloudsTh, MaxCloudsProbability, mask_raster,geometry){
  var startDateWithYear = year+"-"+startDate; // example: 2017 // "08-10" // -> "2017-08-10"
  var endDateWithYear = year+"-"+endDate;
  // load and filter the S2 dataset
  var S2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
           .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', cloudsTh))
           .filterDate(startDateWithYear, endDateWithYear);
  // add cloud mask to each S2 image
  var S2_CLOUD_PROBABILITY = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY');
  S2 = ee.Join.saveFirst('cloud_mask').apply({
  primary: S2,
  secondary: S2_CLOUD_PROBABILITY,
  condition: ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'})
  });
  S2 = ee.ImageCollection(S2);
  // define a function to remove clouds from each image
  var maskClouds = function(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(MaxCloudsProbability);
  return img.mask(isNotCloud);
  };
  var maskEdges = function(s2_img) {
          return s2_img.updateMask(
          s2_img.select('B8A').mask().updateMask(s2_img.select('B9').mask()))
          .updateMask(mask_raster.eq(1))
          //.updateMask(mask_raster.select(0))
      }

  // use the maskClouds function  
  S2 = S2.map(maskClouds).map(maskEdges);
  // calculate median composite
  S2 = S2.median();
  var S2_clip = S2.clip(geometry);
  //
  return S2_clip;
};
 exports.calculateCompositeClip = calculateCompositeClip;
 
 //***************************************** End ************************************************
