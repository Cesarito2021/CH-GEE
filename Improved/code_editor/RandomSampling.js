// CH-GEE original buffered sampling design, with explicit raster projections.
// Adapted from Noel Gorelick (2021), Random Samples With Buffering:
// https://medium.com/google-earth/random-samples-with-buffering-6c8737384f8c
// The article visualizes centre spacing with buffers; CH-GEE samples GEDI inside them.
// pixelCoordinates yields half-integer centres: preserve original +0.5 parity offset.
exports.settings = function(areaHa) {
 var a=ee.Number(areaHa);
 var scale=ee.Number(ee.Algorithms.If(a.lte(4000),10,
   ee.Algorithms.If(a.lt(10000),50,ee.Algorithms.If(a.lt(330000),100,ee.Algorithms.If(a.lt(2200000),200,250)))));
 var cell=ee.Number(ee.Algorithms.If(scale.eq(100),4000,ee.Algorithms.If(a.lt(5000),100,
   ee.Algorithms.If(a.lt(1000000),4000,ee.Algorithms.If(a.lt(3000000),6000,50000)))));
 return {scale:scale,cellSize:cell};
};
exports.generateSamplingSites = function(region,cellSize,seed,maskRaster) {
 var proj=ee.Projection('EPSG:4326').atScale(cellSize), fine=proj.scale(1/16,1/16);
 var xy=ee.Image.pixelCoordinates(proj).reproject(proj);
 var keep=xy.select('x').add(0.5).mod(2).eq(0).and(xy.select('y').add(0.5).mod(2).eq(0));
 var cells=ee.Image.random(seed).multiply(1000000).int().rename('labels')
   .reproject(proj).updateMask(keep).clip(region);
 var random=ee.Image.random(seed).multiply(1000000).int().rename('value').reproject(fine).updateMask(maskRaster.eq(1));
 var maximum=cells.addBands(random).reproject(fine)
   .reduceConnectedComponents(ee.Reducer.max(),'labels',256);
 var points=random.eq(maximum).selfMask().clip(region).toInt();
 var sites=points.reduceToVectors({reducer:ee.Reducer.countEvery(),geometry:region,
   crs:fine,geometryType:'centroid',maxPixels:1e9,tileScale:4});
 return {buffer:sites.map(function(f) { return f.buffer(ee.Number(cellSize).divide(2)); })};
};
