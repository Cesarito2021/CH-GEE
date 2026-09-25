exports.ToGEDI = function(data, kind, start, end, rh, mask, beams, acquisition) {
  beams = beams || 'all'; acquisition = acquisition || 'all';
  if (['all','strong','weak'].indexOf(beams) < 0 || ['all','daytime','nighttime'].indexOf(acquisition) < 0)
    throw new Error('Invalid GEDI beam or acquisition filter');
  if (kind !== 'singleGEDI' && kind !== 'meanGEDI') throw new Error('Invalid GEDI metric mode');
  var col = data.filterDate(start, end).sort('system:time_start').map(function(image) {
    var clean = image.updateMask(image.select('quality_flag').eq(1))
      .updateMask(image.select('degrade_flag').eq(0)).updateMask(mask);
    // NASA GEDI beam groups: full power 0101/0110/1000/1011; coverage 0000/0001/0010/0011.
    if (beams !== 'all') {
      var ids = beams === 'strong' ? [5,6,8,11] : [0,1,2,3];
      clean = clean.updateMask(image.select('beam').remap(ids,[1,1,1,1],0));
    }
    // Explicit boundary: night < 0 degrees; day >= 0 degrees.
    if (acquisition !== 'all') clean = clean.updateMask(acquisition === 'nighttime' ?
      image.select('solar_elevation').lt(0) : image.select('solar_elevation').gte(0));
    return (kind === 'meanGEDI' ? clean.select(['rh75','rh90','rh95','rh100'])
      .reduce(ee.Reducer.mean()) : clean.select(rh)).rename('rh');
  });
  return col.reduce(ee.Reducer.firstNonNull()).rename('rh');
};


// Filter the selected reference metric, after temporal reduction and before sampling.
// A value of exactly 50 m is retained. This does not clip predictions or intervals.
exports.limitHeight = function(reference, maximum) {
  return maximum === null || maximum === undefined ? reference :
    reference.updateMask(reference.select('rh').lte(maximum));
};
