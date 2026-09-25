// Original workspace baseline. Instrumented return only; no predictor/sampling/training edits.
(function(hostRequire,out){var factories={},cache={};
factories["users/calvites1990/CH-GEE:ForForestMasking"]=function(exports){
//************************************************************************************************************
//********************************************** Forest Masking  *********************************************
//************************************************************************************************************

///var ForestMasking = function(for_aoi, mask){
///if(mask=='FNF'){
///var BFNF = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/FNF4")
///        .filterBounds(for_aoi)
///        .filterDate('2017-01-01', '2020-12-31')
///        .first()
///        .select('fnf');
///
///var FNF = ee.Image(0)
///.updateMask(BFNF)
///.where(BFNF.eq(1), 1)
///.where(BFNF.eq(2), 1)
///return(FNF)
///}else if(mask=='DW'){
/// var DW = ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
///                                  .filterBounds(for_aoi)
///                                  .filterDate('2022-06-01', '2022-10-30')
///                                  .first()
/// FNF = DW.select('label').eq(1)
/// return(FNF)
///}else{
///  FNF = ee.Image(1).clip(for_aoi);
///  return(FNF)
///}
///}
///exports.ForestMasking  = ForestMasking;

//*************************************************** End ****************************************************
//************************************************************************************************************
//********************************************** Forest Masking  *********************************************
//************************************************************************************************************
var ForestMasking = function(for_aoi, mask){

  if(mask == 'FNF'){
    // JAXA ALOS PALSAR — unchanged, was already correct
    var BFNF = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/FNF4")
      .filterBounds(for_aoi)
      .filterDate('2017-01-01', '2020-12-31')
      .first()
      .select('fnf');
    var FNF = ee.Image(0)
      .updateMask(BFNF)
      .where(BFNF.eq(1), 1)   // forest
      .where(BFNF.eq(2), 1);  // forest (young secondary)
    return FNF;

  } else if(mask == 'DW'){
    // Dynamic World label key:
    //   0=water  1=trees  2=grass  3=flooded veg  4=crops
    //   5=shrub  6=built  7=bare   8=snow/ice
    //
    // FIX 1 — replaced .first() with .select('label').mode()
    //          .mode() composites ALL valid scenes in the date range and
    //          returns the most frequently observed label per pixel,
    //          giving a stable, gap-free mask across the full AOI.
    //
    // FIX 2 — added .clip(for_aoi) for consistency with the other branches
    var DW = ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
      .filterBounds(for_aoi)
      .filterDate('2022-06-01', '2022-10-30')
      .select('label')
      .mode();                            // FIX 1: was .first()

    var FNF = DW.eq(1).clip(for_aoi);    // FIX 2: clipped to AOI
    return FNF;

  } else {
    var FNF = ee.Image(1).clip(for_aoi);
    return FNF;
  }
};

exports.ForestMasking = ForestMasking;
//*************************************************** End ****************************************************
};
factories["users/calvites1990/CH-GEE:L2A_GEDI_source"]=function(exports){
 //***********************************************************************************************
 //************************************** GEDI-L2A data ******************************************
 //***********************************************************************************************

// var ToGEDI = function(data,gedi_type,startDateGEDI,endDateGEDI,quantile,mask_raster){
//     var qualityMask = function(img){
//     return img.updateMask(img.select("quality_flag").eq(1))
//     .updateMask(img.select("degrade_flag").eq(0))
//     .updateMask(mask_raster.eq(1))};
//  if(gedi_type == 'singleGEDI'){
//     var gedi1 = data.map(qualityMask)
//      .select(quantile) 
//      .filterDate(startDateGEDI,endDateGEDI)
//      .reduce(ee.Reducer.firstNonNull()).rename("rh")
//    return(gedi1)   
//  }if(gedi_type == 'meanGEDI'){ 
//     var gedi2 = data.map(qualityMask)
//              .select('rh75','rh90','rh95','rh100') 
//              .filterDate(startDateGEDI,endDateGEDI)
//              .reduce(ee.Reducer.firstNonNull()) 
//  var gedim2 = ee.Image(gedi2).reduce(ee.Reducer.mean()).rename('rh')
//  return(gedim2)
//  }
//  }
// exports.ToGEDI  = ToGEDI;
 //************************************** End ****************************************************


var ToGEDI = function(data, gedi_type, startDateGEDI, endDateGEDI, quantile, mask_raster,
                      beams_type, shoot_time_type) {

  // ── defaults: strong beams + nighttime ───────────────────────────────────────
  beams_type      = (beams_type      === undefined || beams_type      === null) ? 'strong'    : beams_type;
  shoot_time_type = (shoot_time_type === undefined || shoot_time_type === null) ? 'nighttime' : shoot_time_type;

  // ── quality + optional beam/time filter ──────────────────────────────────────
  var qualityMask = function(img) {

    // base quality flags (same as your original)
    img = img.updateMask(img.select('quality_flag').eq(1))
             .updateMask(img.select('degrade_flag').eq(0));

    // beam filter
    // strong beams: beam ids 5, 6, 8, 11
    // weak   beams: beam ids 0, 1, 2, 3
    if (beams_type !== 'all') {
      var b = img.select('beam');
      var beamMask;
      if (beams_type === 'strong') {
        beamMask = b.eq(5).or(b.eq(6)).or(b.eq(8)).or(b.eq(11));
      } else {
        // 'weak'
        beamMask = b.eq(0).or(b.eq(1)).or(b.eq(2)).or(b.eq(3));
      }
      img = img.updateMask(beamMask);
    }

    // day / night filter based on solar elevation angle
    // nighttime : solar_elevation <= 0
    // daytime   : solar_elevation >  0
    if (shoot_time_type !== 'all') {
      var se = img.select('solar_elevation');
      var timeMask = (shoot_time_type === 'nighttime') ? se.lte(0) : se.gt(0);
      img = img.updateMask(timeMask);
    }

    // external forest mask (FNF / DW)
    if (mask_raster !== null && mask_raster !== undefined) {
      img = img.updateMask(mask_raster.eq(1));
    }

    return img;
  };

  // ── singleGEDI — one selected RH band, median composite ──────────────────────
  if (gedi_type === 'singleGEDI') {
    var bandName = (typeof quantile === 'string') ? quantile : 'rh95';
    var gedi1 = ee.ImageCollection(data || 'LARSE/GEDI/GEDI02_A_002_MONTHLY')
      .filterDate(startDateGEDI, endDateGEDI)
      .map(qualityMask)
      .select([bandName])
      .median()
      .rename('rh');
    return gedi1;
  }

  // ── meanGEDI — mean across rh75/rh90/rh95/rh100, median composite ────────────
  if (gedi_type === 'meanGEDI') {
    var gedi2 = ee.ImageCollection(data || 'LARSE/GEDI/GEDI02_A_002_MONTHLY')
      .filterDate(startDateGEDI, endDateGEDI)
      .map(qualityMask)
      .select(['rh75', 'rh90', 'rh95', 'rh100'])
      .median()
      .reduce(ee.Reducer.mean())
      .rename('rh');
    return gedi2;
  }

  throw new Error('ToGEDI: unknown gedi_type "' + gedi_type + '". Use "singleGEDI" or "meanGEDI".');
};

exports.ToGEDI = ToGEDI;

//*************************************************** End ****************************************************
};
factories["users/calvites1990/CH-GEE:Sentinel2_source"]=function(exports){
//***********************************************************************************************
//*************************************** Sentinel 2   ******************************************
//***********************************************************************************************
 
 var calculateCompositeClip = function(year, startDate, endDate, cloudsTh, MaxCloudsProbability, mask_raster,geometry){
  var startDateWithYear = year+"-"+startDate; // example 2017 // "08-10" // -> "2017-08-10"
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
};
factories["users/calvites1990/CH-GEE:Sentinel1_source"]=function(exports){
//***********************************************************************************************
//********************************* Sentinel 1   ************************************************
//***********************************************************************************************
//var speckle_filter = require('users/adugnagirma/gee_s1_ard:speckle_filter');
//var terrain_flattening = require('users/adugnagirma/gee_s1_ard:terrain_flattening');
//var border_noise_correction = require('users/adugnagirma/gee_s1_ard:border_noise_correction');
//
//var to_sentinel_filtered = function(year, start_date,end_date,aoi, mask_raster){
////
//var  START_DATE= year+"-"+start_date;
//var STOP_DATE= year+"-"+end_date;
//      var s1 = ee.ImageCollection('COPERNICUS/S1_GRD_FLOAT')
//      .filter(ee.Filter.eq('instrumentMode', 'IW'))
//      .filter(ee.Filter.eq('resolution_meters', 10))
//      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) // added new1
//      .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) // added new2
//      .filterDate(START_DATE, STOP_DATE)
//      .filterBounds(aoi)
//      //
//      s1 = s1.select(['VV','VH','angle'])
//       //
//      var S1_1 = s1.map(border_noise_correction.f_mask_edges);
//      //
//      //
//      var s2 = ee.ImageCollection(speckle_filter.MultiTemporal_Filter(S1_1, 
//      15, //params.SPECKLE_FILTER_KERNEL_SIZE,
//      "GAMMA MAP",//params.SPECKLE_FILTER,
//      10 ));
//      //
//      var s3 = ee.ImageCollection(terrain_flattening.slope_correction(s2,
//      'VOLUME', //params.TERRAIN_FLATTENING_MODEL,
//      ee.Image('USGS/SRTMGL1_003'),//params.DEM,
//      0//params.TERRAIN_FLATTENING_ADDITIONAL_LAYOVER_SHADOW_BUFFER
//      )); 
//  
//    var s4 = s3.map(function(image) {
//             return image.clip(aoi)
//             .updateMask(mask_raster.eq(1));
//             //.updateMask(mask_raster.select(0));
//             })
//            //
//       var composite = ee.Image.cat([
//       s3.select('VH').mean(),
//       s3.select('VV').mean()
//       ]);//.focal_median();
//       return(composite)}
//
//exports.to_sentinel_filtered  = to_sentinel_filtered;
//
//********************************** end **************************************************
//************************************************************************************************************
//**************************************** Sentinel-1 ARD Library ********************************************
//************************************************************************************************************
//
//  CALLING STYLES — all work:
//
//  Style A — original positional args (plain numbers/strings):
//    var res = lib.to_sentinel_filtered(2022, '06-01', '10-30', aoi, mask_raster);
//
//  Style B — single options object (all config in one place):
//    var res = lib.to_sentinel_filtered({
//      year: 2022, start_date: '06-01', end_date: '10-30',
//      aoi: geometry, mask_raster: mask_raster, format: 'DB'
//    });
//
//  Style C — full ISO date strings, no year needed:
//    var res = lib.best_S1_image({
//      start_date: '2022-06-01', end_date: '2022-10-30', aoi: geometry
//    });
//
//  RETURN VALUE — always an object with three keys:
//    res.composite   → mean VH+VV image  (same as old function — use this for DB/LINEAR)
//    res.best        → best scored single image
//    res.collection  → full preprocessed + masked collection
//
//  TO GET DB OUTPUT:
//    var res = lib.to_sentinel_filtered({ ..., format: 'DB' });
//    Map.addLayer(res.composite, {}, 'S1 DB composite');
//
//************************************************************************************************************

var wrapper = require('users/adugnagirma/gee_s1_ard:wrapper');


// ── build a clean 'YYYY-MM-DD' string from any combination of inputs ──────────
var _buildDate = function(year, part) {
  part = String(part).trim();
  if (part.match(/^\d{4}-\d{2}-\d{2}$/)) return part;   // already full ISO
  if (!year && year !== 0) throw new Error(
    'S1 library: year is missing. Pass year as a number (2022) ' +
    'or use full ISO date strings like "2022-06-01".');
  return String(year).trim() + '-' + part;
};


//************************************************************************************************************
//  CORE — best_S1_image
//************************************************************************************************************
var best_S1_image = function(opt) {

  opt = opt || {};

  var aoi        = opt.aoi;
  var start_date = opt.start_date;
  var end_date   = opt.end_date;
  var year       = opt.year || null;

  if (!aoi)        throw new Error('S1 library: opt.aoi is required.');
  if (!start_date) throw new Error('S1 library: opt.start_date is required.');
  if (!end_date)   throw new Error('S1 library: opt.end_date is required.');

  var startStr = _buildDate(year, start_date);
  var endStr   = _buildDate(year, end_date);
  var START    = ee.Date(startStr);
  var END      = ee.Date(endStr);

  var framework  = (opt.framework  || 'MULTI').toUpperCase();
  var nrOfImages =  opt.nrOfImages || 10;
  var orbit      = (opt.orbit      || 'BOTH').toUpperCase();
  var format     = (opt.format     || 'LINEAR').toUpperCase();   // 'LINEAR' or 'DB'
  var wTime      = (opt.scoreWeights && opt.scoreWeights.time     != null) ? opt.scoreWeights.time     : 0.7;
  var wVar       = (opt.scoreWeights && opt.scoreWeights.variance != null) ? opt.scoreWeights.variance : 0.3;

  var mask_raster = (opt.mask_raster === null || opt.mask_raster === undefined)
    ? ee.Image(1)
    : ee.Image(opt.mask_raster);

  //print('── S1 library input ────────────────────');
  //print('START     :', startStr);
  //print('END       :', endStr);
  //print('orbit     :', orbit);
  //print('framework :', framework);
  //print('format    :', format);
  //print('────────────────────────────────────────');

  // ── wrapper params ───────────────────────────────────────────────────────────
  var params = {
    START_DATE:   startStr,
    STOP_DATE:    endStr,
    POLARIZATION: 'VVVH',
    ORBIT:        orbit,
    GEOMETRY:     aoi,
    APPLY_ADDITIONAL_BORDER_NOISE_CORRECTION:            true,
    APPLY_SPECKLE_FILTERING:                             true,
    SPECKLE_FILTER_FRAMEWORK:                            framework,
    SPECKLE_FILTER:                                      'GAMMA MAP',
    SPECKLE_FILTER_KERNEL_SIZE:                          15,
    APPLY_TERRAIN_FLATTENING:                            true,
    DEM:                                                 ee.Image('USGS/SRTMGL1_003'),
    TERRAIN_FLATTENING_MODEL:                            'VOLUME',
    TERRAIN_FLATTENING_ADDITIONAL_LAYOVER_SHADOW_BUFFER: 0,
    FORMAT:       format,
    CLIP_TO_ROI:  true,
    SAVE_ASSETS:  false
  };

  if (framework === 'MULTI') {
    params.SPECKLE_FILTER_NR_OF_IMAGES = nrOfImages;
  }

  // ── preprocessing ────────────────────────────────────────────────────────────
  var processed = ee.ImageCollection(wrapper.s1_preproc(params)[1]);

  processed = processed.map(function(img) {
    return img.updateMask(mask_raster.eq(1));
  });

  // ── score each scene ─────────────────────────────────────────────────────────
  var mid = START.advance(END.difference(START, 'day').divide(2), 'day');

  var scored = processed.map(function(img) {
    var timeScore = ee.Number(img.date().difference(mid, 'day')).abs();
    var varianceVV = ee.Number(
      img.select('VV').reduceRegion({
        reducer: ee.Reducer.variance(), geometry: aoi,
        scale: 30, bestEffort: true, maxPixels: 1e9
      }).get('VV')
    );
    var score = timeScore.multiply(wTime).add(varianceVV.multiply(wVar));
    return img.set({ quality_score: score, timeScore_days: timeScore, varVV: varianceVV });
  });

  var best = ee.Image(scored.sort('quality_score').first());

  // ── composite — VH + VV mean ─────────────────────────────────────────────────
  var composite = ee.Image.cat([
    processed.select('VH').mean(),
    processed.select('VV').mean()
  ]);

 // print('── S1 library result ───────────────────');
 // print('Processed scenes :', processed.size());
 // print('Best image date  :', best.date());
 // print('quality_score    :', best.get('quality_score'));
 // print('timeScore_days   :', best.get('timeScore_days'));
 // print('varVV            :', best.get('varVV'));
 // print('────────────────────────────────────────');

  return { best: best, composite: composite, collection: processed };
};


//************************************************************************************************************
//  WRAPPER — to_sentinel_filtered
//
//  Accepts BOTH calling styles:
//
//    // positional (original style)
//    lib.to_sentinel_filtered(year, startDate, endDate, aoi, mask_raster)
//
//    // options object (new style — supports format:'DB' etc.)
//    lib.to_sentinel_filtered({ year, start_date, end_date, aoi, mask_raster, format, ... })
//
//************************************************************************************************************
var to_sentinel_filtered = function(yearOrOpt, start_date, end_date, aoi, mask_raster) {

  // ── Style B: single options object passed as first argument ──────────────────
  if (yearOrOpt !== null && typeof yearOrOpt === 'object' &&
      !yearOrOpt.evaluate && !yearOrOpt.getInfo) {
    // it is a plain JS object (not an ee object) — treat as options dict
    return best_S1_image(yearOrOpt);
  }

  // ── Style A: classic positional arguments ────────────────────────────────────
  return best_S1_image({
    year:        yearOrOpt,
    start_date:  start_date,
    end_date:    end_date,
    aoi:         aoi,
    framework:   'MULTI',
    nrOfImages:  10,
    orbit:       'BOTH',
    format:      'DB',
    mask_raster: mask_raster
  });
};


//************************************************************************************************************
//  EXPORTS
//************************************************************************************************************
exports.best_S1_image        = best_S1_image;
exports.to_sentinel_filtered = to_sentinel_filtered;

//*************************************************** End ****************************************************
};
factories["users/calvites1990/CH-GEE:RandomSampling"]=function(exports){
//***********************************************************************************************
//**************************** Samping Design for large forest covers   *************************
//***********************************************************************************************
var generateSamplingSites = function(region, cellSize, seed,mask_raster) {
  // Generate a random image of integers in the specified region and projection.
  var proj = ee.Projection("EPSG:4326").atScale(cellSize);
  var cells = ee.Image.random(seed).multiply(1000000).int().clip(region).reproject(proj);
  // 
  var random = ee.Image.random(seed).multiply(1000000).int();
  var maximum = cells.addBands(random).reduceConnectedComponents(ee.Reducer.max());
  // Find all the points that are local maximums.
  var points = random.eq(maximum).selfMask().clip(region);
  // Create a mask to remove every pixel with even coordinates in either X or Y.
  var mask_img = ee.Image.pixelCoordinates(proj)
      .expression("!((b('x') + 0.5) % 2 != 0 || (b('y') + 0.5) % 2 != 0)");
  //
  var strictCells = cells.updateMask(mask_img)
  .updateMask(mask_img
  .updateMask(mask_raster.eq(1)))
  .reproject(proj);
   
 var strictMax = strictCells.addBands(random).reduceConnectedComponents(ee.Reducer.max());
  var strictPoints = random.eq(strictMax).selfMask().clip(region);
  
  var samples = strictPoints.reduceToVectors({
    reducer: ee.Reducer.countEvery(), 
    geometry: region,
    crs: proj.scale(1/16, 1/16), 
    geometryType: "centroid", 
    maxPixels: 1e9
  });
  
// Add a buffer around each point
  var buffer = samples.map(function(f) { return f.buffer(ee.Number(cellSize).divide(2)) });
  
  return {
    buffer: buffer,
  };
}
   exports.generateSamplingSites = generateSamplingSites;
   
//********************************************* End *********************************************
};
factories["users/calvites1990/CH-GEE:CH-GEE_main"]=function(exports){
//***************************************************************************************************************
//********************************************* Canopy Height Mapper  *******************************************
//***************************************************************************************************************

var CanopyHeightMapper = function(aoi, year, start_date, end_date,startDateGEDI,endDateGEDI,cloudsTh, quantile, model, mask, gedi_type,
numTreesRF,varSplitRF,minLeafPopuRF,bagFracRF,maxNodesRF,numTreesGBM,shrGBM,samLingRateGBM,maxNodesGBM,lossGBM,maxNodesCART,minLeafPopCART,knownAreaHa){
  
  //***************************************************************************************************************
  //  Input Data
  //***************************************************************************************************************

  var startDateWithYear = year+"-"+start_date; 
  var endDateWithYear   = year+"-"+end_date;
  
  //***************************************************************************************************************
  //  Importing Area of Insterest (AOI) through drawing or uploading
  //***************************************************************************************************************

  var aoi2 = ee.Geometry(ee.FeatureCollection(aoi).geometry())//.geometries()
  var polygonArea = aoi2.area({'maxError': 1});
  polygonArea = knownAreaHa === undefined ? (polygonArea.divide(10000).round()).getInfo() : knownAreaHa;
  
  //***************************************************************************************************************
  //  Adjusting the Visualization Settings for the AOI
  //***************************************************************************************************************
  
  if(polygonArea < 2000 ){var scale = 10
  }
  else if(polygonArea >= 2000 & polygonArea < 10000){
    scale = 50
    }
  else if(polygonArea >= 10000 & polygonArea < 20000){
    scale = 100
    }
  else if(polygonArea >= 10000 & polygonArea < 330000){
    scale = 100
    ;
  }else if(polygonArea >= 330000 & polygonArea < 2200000){ 
    scale = 200
    ;
  }else if(polygonArea >= 2200000 & polygonArea < 10000000){ 
    scale = 250
    ;
  }else {scale = 250
  ;}
  
  //***************************************************************************************************************
  //  Selecting one of the three Forest Masks within the AOI
  //***************************************************************************************************************

  var library10 = localRequire("users/calvites1990/CH-GEE:ForForestMasking");
  var FNF = library10.ForestMasking(aoi2,mask);
 
  //***************************************************************************************************************
  //  Selecting Dependent variables
  //***************************************************************************************************************
  //***************************************************************************************************************
  //  GEDI Relative Height (RH) metrics
  //***************************************************************************************************************
  var dataset = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY")
  var library2 = localRequire("users/calvites1990/CH-GEE:L2A_GEDI_source"); 
  //var gedi = library2.ToGEDI(dataset,gedi_type,startDateGEDI,endDateGEDI,quantile,FNF) 
  var gedi = library2.ToGEDI(dataset, gedi_type, startDateGEDI, endDateGEDI,quantile, FNF, 'all', 'all');
  //***************************************************************************************************************
  //  Selecting Independent variables
  //***************************************************************************************************************
  //***************************************************************************************************************
  //  Harmonized Sentinel-2 MSI: MultiSpectral Instrument, Level-2A
  //***************************************************************************************************************
  var library3 = localRequire("users/calvites1990/CH-GEE:Sentinel2_source");
  var s2 = library3.calculateCompositeClip(year, start_date, end_date, cloudsTh, 20,FNF,aoi2);
  
  //***************************************************************************************************************
  // Global Multi-resolution Terrain Elevation Data 2010
  // Slope from Global Multi-resolution Terrain Elevation Data 2010
  //***************************************************************************************************************
  var dem       = ee.Image("USGS/GMTED2010")
  var Mask      = dem.gt(0);
  var demMasked = dem.mask(Mask).rename('dem');
  var slope     = ee.Terrain.slope(demMasked );
  var aspect    = ee.Terrain.aspect(demMasked );
  //***************************************************************************************************************
  //  Sentinel-1
  //***************************************************************************************************************
  var library6 = localRequire("users/calvites1990/CH-GEE:Sentinel1_source");
  //var composite = library6.to_sentinel_filtered(year, start_date,end_date,aoi2,FNF)
  var composite = library6.to_sentinel_filtered(year, start_date, end_date, aoi2, FNF).composite;
  //***************************************************************************************************************
  //  Creating a dataset using dependent and independent variables
  //***************************************************************************************************************
  var merged = s2.select(ee.List.sequence(0,11,1)).addBands(gedi)
  .addBands(demMasked).addBands(slope).addBands(aspect).addBands(composite);
  //***************************************************************************************************************
  //  Application of random sampling in large areas
  //***************************************************************************************************************
  if(scale === 100){
   var cellSize = 4000
  }else{  
   if(polygonArea < 5000){
     cellSize = 100                              
   }else if( polygonArea >= 5000 & polygonArea < 1000000){
     cellSize = 4000;// 4000 // Riducendo questo valore aumenti l'accuratezza
   }else if(polygonArea >= 1000000 & polygonArea < 2000000){ 
     cellSize = 6000 //6000
   }else if(polygonArea >= 2000000 & polygonArea < 3000000){
       cellSize = 6000
       }else{cellSize = 50000;
     }}
    //
   var libraryRS = localRequire("users/calvites1990/CH-GEE:RandomSampling");
   var generatedPoints = libraryRS.generateSamplingSites(aoi2, cellSize, 1, FNF);
   var aoi_buffer = generatedPoints.buffer;
   var aoi_prova = aoi_buffer.geometry();
  //***************************************************************************************************************
  //  Sampling configuration for small and large area (4000 km2 is used as the threshold)
  //***************************************************************************************************************
   if(polygonArea <= 4000){
    var reference = merged.sample({
      region: aoi,
      scale: 10, 
      dropNulls: true,
      numPixels: 1e13, 
      tileScale: 4,
      seed: 0,
      geometries: true});
      }else{ 
        reference = merged.sample({
       region: ee.Geometry(aoi_prova),
       scale: scale, 
       dropNulls: true,
       numPixels: 1e13, 
       tileScale: 16,
       seed: 0,
       geometries: true});
      }
  //***************************************************************************************************************
  //  Splitting the dataset into training and validation sets 
  //***************************************************************************************************************
   reference = reference.randomColumn('random');
   var split = 0.7;
   var training = reference.filter(ee.Filter.lt('random', split));
   var validation = reference.filter(ee.Filter.gte('random', split));

  //***************************************************************************************************************
  // Colnames all of used variables
  //***************************************************************************************************************
   var predictorsNames = s2.select(ee.List.sequence(0,11,1))
  .addBands(demMasked).addBands(slope).addBands(aspect)//.bandNames();
  .addBands(composite).bandNames();
  //
  var _n = function(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' && v.trim().toLowerCase() === 'null') return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  };
 
  //***************************************************************************************************************
  // Configurating the hyperparameters in each of the three machine learning algorithms:
  // RF   - Random Forest 
  // CART - Classification And Regression Trees classifier
  // GBM  - Gradient Tree Boost 
  //***************************************************************************************************************
  if(model=="RF"){
    var rfParams = {};
    if(_n(numTreesRF)   !== null) rfParams.numberOfTrees    = _n(numTreesRF);
    if(_n(varSplitRF)   !== null) rfParams.variablesPerSplit = _n(varSplitRF);
    if(_n(minLeafPopuRF)!== null) rfParams.minLeafPopulation = _n(minLeafPopuRF);
    if(_n(bagFracRF)    !== null) rfParams.bagFraction       = _n(bagFracRF);
    if(_n(maxNodesRF)   !== null) rfParams.maxNodes          = _n(maxNodesRF);
    var classifier = ee.Classifier.smileRandomForest(rfParams)
      .setOutputMode("Regression")
      .train(training, "rh", predictorsNames);
  }
  //***************************************************************************************************************
  if(model=="CART"){
    var cartParams = {};
    if(_n(maxNodesCART)   !== null) cartParams.maxNodes          = _n(maxNodesCART);
    if(_n(minLeafPopCART) !== null) cartParams.minLeafPopulation = _n(minLeafPopCART);
    classifier = ee.Classifier.smileCart(cartParams)
      .train(training, "rh", predictorsNames)
      .setOutputMode("Regression");
  }
  //***************************************************************************************************************
  if(model=="GBM"){
    var gbmParams = {};
    if(_n(numTreesGBM)   !== null) gbmParams.numberOfTrees  = _n(numTreesGBM);
    if(_n(shrGBM)        !== null) gbmParams.shrinkage       = _n(shrGBM);
    if(_n(samLingRateGBM)!== null) gbmParams.samplingRate    = _n(samLingRateGBM);
    if(_n(maxNodesGBM)   !== null) gbmParams.maxNodes        = _n(maxNodesGBM);
    // if(lossGBM && lossGBM !== 'null') gbmParams.loss      = lossGBM;
    classifier = ee.Classifier.smileGradientTreeBoost(gbmParams)
      .train(training, "rh", predictorsNames)
      .setOutputMode("Regression");
  }
  //***************************************************************************************************************
  // Configurating the hyperparameters in each of the three machine learning algorithms:
  // RF   - Random Forest 
  // CART - Classification And Regression Trees classifier
  // GB   - Gradient Tree Boost 
  //***************************************************************************************************************
  //if(model=="RF"){
  //  var  classifier = ee.Classifier.smileRandomForest({
  //    numberOfTrees:ee.Number(numTreesRF),
  //    variablesPerSplit: ee.Number(varSplitRF),
  //    minLeafPopulation: ee.Number(minLeafPopuRF), 
  //    bagFraction: ee.Number(bagFracRF), 
  //    maxNodes: ee.Number(maxNodesRF)
  //    }).setOutputMode("Regression") // used to predict class / continuous variables etc.
  //                  .train(training, "rh", predictorsNames); 
  //                  }
  ////***************************************************************************************************************
  // if(model=="CART"){
  // classifier = ee.Classifier.smileCart({
  //   maxNodes: maxNodesCART,
  //   minLeafPopulation: ee.Number(minLeafPopCART)
  //   }).train(training, "rh", predictorsNames)
  //                  .setOutputMode("Regression"); // used to predict class / continuous variables etc.
  //    }
  ////***************************************************************************************************************
  //if(model=="GBM"){
  // classifier = ee.Classifier.smileGradientTreeBoost({
  //   numberOfTrees: ee.Number(numTreesGBM),
  //  shrinkage: ee.Number(shrGBM),
  //  samplingRate: ee.Number(samLingRateGBM),
  //  maxNodes: ee.Number(maxNodesGBM),
  // // loss: ee.String(lossGBM)
  //  }).train(
  //  training, "rh", predictorsNames)
  //  .setOutputMode("Regression"); // used to predict class / continuous variables etc.
  // }
  //***************************************************************************************************************
  // Prediction of canopy heights 
  //***************************************************************************************************************
  var classified = merged.classify(classifier);

  //***************************************************************************************************************
  // Scatter Plot 
  //***************************************************************************************************************
  return {image:classified,validation:validation.classify(classifier),training:training,classifier:classifier,bands:predictorsNames};
  };
exports.CanopyHeightMapper = CanopyHeightMapper;

//***************************************************** End *****************************************************
};
function localRequire(name){if(!factories[name])return hostRequire(name);if(!cache[name]){cache[name]={};factories[name](cache[name]);}return cache[name];}
out.run=function(o){return localRequire('users/calvites1990/CH-GEE:CH-GEE_main').CanopyHeightMapper(o.aoi,o.year,o.start_date,o.end_date,o.startDateGEDI,o.endDateGEDI,o.cloudsTh,o.quantile,o.model,o.mask,o.gedi_type,o.numTreesRF,o.varSplitRF,o.minLeafPopuRF,o.bagFracRF,o.maxNodesRF,o.numTreesGBM,o.shrGBM,o.samLingRateGBM,o.maxNodesGBM,o.lossGBM,o.maxNodesCART,o.minLeafPopCART,o.areaHa);};
})(require,exports);
