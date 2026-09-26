var bands = ['B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B11','B12'];
exports.bands = bands;
exports.collection = function(year, start, end, clouds, probability, geometry) {
  var dates = [start.length===10?start:year + '-' + start, end.length===10?end:year + '-' + end];
  var sr = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(geometry).filterDate(dates[0], dates[1])
    .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', clouds));
  var cp = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
    .filterBounds(geometry).filterDate(dates[0], dates[1]);
  return ee.ImageCollection(ee.Join.saveFirst('cloud_mask').apply({
    primary:sr, secondary:cp,
    condition:ee.Filter.equals({leftField:'system:index', rightField:'system:index'})
  })).map(function(image) {
    image = ee.Image(image);
    var clear = ee.Image(image.get('cloud_mask')).select('probability').lt(probability);
    var edges = image.select('B8A').mask().and(image.select('B9').mask());
    return image.select(bands).updateMask(clear).updateMask(edges)
      .copyProperties(image, ['system:time_start']);
  });
};
exports.calculateCompositeClip = function(year, start, end, clouds, probability, mask, geometry, method) {
  method = method || 'median';
  var col = exports.collection(year, start, end, clouds, probability, geometry);
  if (method !== 'median') throw new Error('S2 composite must be median');
  var image = col.median();
  return image.select(bands).updateMask(mask).clip(geometry)
    .set('scene_count', col.size(), 'composite_method', method);
};

