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
