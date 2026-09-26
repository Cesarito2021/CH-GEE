// Classes follow the official Earth Engine dataset catalogues.
exports.ForestMasking = function(geometry, kind, year, classes) {
  classes = classes || (kind === 'DW' ? [1] : [1,2]);
  var retained = classes.map(function() { return 1; });
  if (kind === 'FNF') {
    // FNF4: 1=dense forest, 2=non-dense forest, 3=non-forest, 4=water.
    var fnf = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/FNF4')
      .filterBounds(geometry).filterDate(year + '-01-01', (year + 1) + '-01-01')
      .select('fnf').mosaic();
    return fnf.remap(classes,retained,0).selfMask().clip(geometry);
  }
  if (kind === 'DW') {
    return ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1').filterBounds(geometry)
      .filterDate(year + '-01-01', (year + 1) + '-01-01')
      .select('label').mode().remap(classes,retained,0).selfMask().clip(geometry);
  }
  if (kind !== 'none') throw new Error('Forest mask must be none, FNF or DW');
  return ee.Image(1).clip(geometry);
};

