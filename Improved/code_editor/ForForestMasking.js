exports.ForestMasking = function(geometry, kind, year) {
  if (kind === 'FNF') {
    // FNF4: 1=dense forest, 2=non-dense forest, 3=non-forest, 4=water.
    var fnf = ee.ImageCollection('JAXA/ALOS/PALSAR/YEARLY/FNF4')
      .filterBounds(geometry).filterDate(year + '-01-01', (year + 1) + '-01-01')
      .select('fnf').mosaic();
    return fnf.eq(1).or(fnf.eq(2)).selfMask().clip(geometry);
  }
  if (kind === 'DW') {
    return ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1').filterBounds(geometry)
      .filterDate(year + '-01-01', (year + 1) + '-01-01')
      .select('label').mode().eq(1).selfMask().clip(geometry);
  }
  if (kind !== 'none') throw new Error('Forest mask must be none, FNF or DW');
  return ee.Image(1).clip(geometry);
};

