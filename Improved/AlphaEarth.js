// Annual AlphaEarth embeddings and terrain predictors.
function geom(value) {
  return typeof value.geometry === 'function' ? value.geometry() : value;
}
exports.generateDEMStack30m = function(boundary, source, scale) {
  var region = geom(boundary), elevation;
  source = source || 'COPERNICUS'; scale = scale || 30;
  if (source === 'GMTED2010') {
    elevation = ee.Image('USGS/GMTED2010').select('be75');
  } else if (source === 'COPERNICUS') {
    elevation = ee.ImageCollection('COPERNICUS/DEM/GLO30').filterBounds(region.buffer(100))
      .select('DEM').mosaic();
  } else throw new Error('Unknown DEM source: ' + source);
  // A mosaic defaults to a coarse projection; explicitly define the terrain grid.
  // Preserve GMTED's native grid for its derivatives; upsampling is not new terrain detail.
  var grid = source === 'GMTED2010' ? elevation.rename('elevation').toFloat() :
    elevation.rename('elevation').toFloat().reproject('EPSG:4326', null, scale);
  return grid.addBands(ee.Terrain.slope(grid).rename('slope'))
    .addBands(ee.Terrain.aspect(grid).rename('aspect')).clip(region);
};
exports.generateGoogleEmbeddingStack = function(boundary, startYear, endYear) {
  if (Number(startYear) !== Number(endYear)) throw new Error('Use one annual embedding at a time');
  var region = geom(boundary);
  return ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL').filterBounds(region)
    .filterDate(ee.Date.fromYMD(Number(startYear),1,1), ee.Date.fromYMD(Number(startYear)+1,1,1))
    .mosaic().clip(region);
};
exports.addLatLonBands = function(image, boundary) {
  return image.addBands(ee.Image.pixelLonLat().clip(geom(boundary)));
};
exports.ee_build_AlphaEarth_embedding_terrain_stack = function(boundary, start, end,
  maskOutside, scale, multiplyTerrain, addLonLat, source) {
  var terrain = exports.generateDEMStack30m(boundary, source, scale);
  if (multiplyTerrain) terrain = terrain.select('elevation').addBands(terrain.select(['slope','aspect']).multiply(10));
  var image = exports.generateGoogleEmbeddingStack(boundary,start,end).addBands(terrain);
  if (addLonLat !== false) image = exports.addLatLonBands(image,boundary);
  return maskOutside === false ? image : image.clip(geom(boundary));
};

