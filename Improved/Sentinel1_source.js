// Uses the established external ARD dependency; no per-scene reduceRegion scoring.
var wrapper = require('users/adugnagirma/gee_s1_ard:wrapper');
exports.to_sentinel_filtered = function(opt) {
  var method = opt.composite || 'median';
  if (['mean','median'].indexOf(method) < 0) throw new Error('Invalid S1 composite');
  var params = {
    START_DATE:opt.year + '-' + opt.start_date, STOP_DATE:opt.year + '-' + opt.end_date,
    POLARIZATION:'VVVH', ORBIT:opt.orbit || 'BOTH', GEOMETRY:opt.aoi,
    APPLY_ADDITIONAL_BORDER_NOISE_CORRECTION:true, APPLY_SPECKLE_FILTERING:true,
    SPECKLE_FILTER_FRAMEWORK:opt.framework || 'MULTI', SPECKLE_FILTER:'GAMMA MAP',
    SPECKLE_FILTER_KERNEL_SIZE:15, SPECKLE_FILTER_NR_OF_IMAGES:opt.nrOfImages || 10,
    APPLY_TERRAIN_FLATTENING:true, DEM:opt.terrain_dem || ee.Image('USGS/SRTMGL1_003'),
    TERRAIN_FLATTENING_MODEL:'VOLUME', TERRAIN_FLATTENING_ADDITIONAL_LAYOVER_SHADOW_BUFFER:0,
    FORMAT:opt.format || 'DB', CLIP_TO_ROI:true, SAVE_ASSETS:false
  };
  var col = ee.ImageCollection(wrapper.s1_preproc(params)[1]).map(function(image) {
    return image.select(['VH','VV']).updateMask(opt.mask_raster || ee.Image(1));
  });
  var composite = method === 'mean' ? col.mean() : col.median();
  return {collection:col, composite:composite.set('scene_count', col.size(), 'composite_method', method)};
};


