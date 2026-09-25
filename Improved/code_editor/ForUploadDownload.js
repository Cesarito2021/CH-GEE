// Code Editor only. The public viewing app does not require this module.
exports.toDrive = function(result, options) {
  options = options || {};
  Export.image.toDrive({
    image:result.image.toFloat().unmask(-9999), description:options.description || 'CH_GEE',
    folder:options.folder || 'CH_GEE', region:result.prepared.geometry,
    scale:options.scale || result.prepared.options.predictorScale, crs:options.crs || 'EPSG:4326',
    maxPixels:1e13, fileFormat:'GeoTIFF', formatOptions:{cloudOptimized:true,noData:-9999}
  });
  Export.table.toDrive({
    collection:ee.FeatureCollection([ee.Feature(null,result.metrics)]),
    description:(options.description || 'CH_GEE') + '_metrics',
    folder:options.folder || 'CH_GEE', fileFormat:'CSV'
  });
};

