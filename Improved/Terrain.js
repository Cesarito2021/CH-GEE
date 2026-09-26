// Terrain predictors. Copernicus GLO-30 and GMTED2010.
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
