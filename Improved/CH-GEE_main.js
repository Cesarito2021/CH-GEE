// CH-GEE improved library. Computation is independent of Map/ui.
var config = require('users/calvites1990/CH-GEE_Improved:Config');
var ae = require('users/calvites1990/CH-GEE_Improved:AlphaEarth');
var masks = require('users/calvites1990/CH-GEE_Improved:ForForestMasking');
var gediLib = require('users/calvites1990/CH-GEE_Improved:L2A_GEDI_source');
var s2Lib = require('users/calvites1990/CH-GEE_Improved:Sentinel2_source');
var s1Lib = require('users/calvites1990/CH-GEE_Improved:Sentinel1_source');
var sampling = require('users/calvites1990/CH-GEE_Improved:RandomSampling');
var legacy = require('users/calvites1990/CH-GEE_Improved:LegacyPredictor');

function geometry(aoi) {
  return ee.FeatureCollection(aoi).geometry();
}
function predictors(o, region) {
  var terrain = ae.generateDEMStack30m(region, o.dem_source, 30);
  var stack, diagnostics = {};
  if (o.dataset_option === 'GEE') {
    var embedding = ae.generateGoogleEmbeddingStack(region, o.year, o.year);
    stack = embedding.addBands(terrain);
    diagnostics.embedding_bands = embedding.bandNames().size();
  } else {
    // Build the full buffered region once. Never fill missing predictors with zero.
    var s2 = s2Lib.calculateCompositeClip(o.year, o.start_date, o.end_date,
      o.cloudsTh, o.cloudProbability, ee.Image(1), region, o.s2_composite);
    var s1 = s1Lib.to_sentinel_filtered({
      year:o.year, start_date:o.start_date, end_date:o.end_date, aoi:region,
      mask_raster:ee.Image(1), orbit:o.orbit, format:'DB', composite:o.s1_composite
    });
    stack = s2.select(s2Lib.bands).addBands(terrain).addBands(s1.composite);
    diagnostics.s2_scenes = s2.get('scene_count');
    diagnostics.s1_scenes = s1.collection.size();
  }
  return {image:stack.addBands(ee.Image.pixelLonLat()).toFloat().clip(region), diagnostics:diagnostics};
}
exports.referencePoints = function(options) {
  var o = config.normalize(options);
  var base = geometry(o.aoi);
  var region = o.buffer ? base.buffer(o.buffer, 1) : base;
  var gedi = gediLib.ToGEDI(ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY')
    .filterBounds(region), o.gedi_type, o.startDateGEDI, o.endDateGEDI, o.quantile, ee.Image(1), o.beams, o.acquisition);
  gedi = gediLib.limitHeight(gedi, o.maxReferenceHeight);
  var settings=sampling.settings(base.area(1).divide(10000).round());
  var sampleRegion=region, sampleScale=o.sampleScale;
  if (o.sampling !== 'fixed') {
    var sites=sampling.generateSamplingSites(region,settings.cellSize,1,masks.ForestMasking(region,o.mask,o.year));
    sampleRegion=ee.Geometry(ee.Algorithms.If(base.area(1).divide(10000).round().lte(4000),region,
      sites.buffer.geometry(10).intersection(region,10)));
    sampleScale=o.sampling === 'legacy' ? settings.scale : o.sampleScale;
  }
  // Sampling coordinates are retained by reduceRegions; no nearest-neighbor label join.
  var refs = gedi.sample({region:sampleRegion, projection:ee.Projection('EPSG:4326').atScale(sampleScale),
    geometries:true, tileScale:4, dropNulls:true}).map(function(f) {
    var xy = f.geometry().coordinates();
    var id = ee.Number(xy.get(0)).format('%.8f').cat('_').cat(ee.Number(xy.get(1)).format('%.8f'));
    var meters = f.geometry().transform('EPSG:3857', 1).coordinates();
    var block = ee.Number(meters.get(0)).divide(o.blockSize).floor().format('%d')
      .cat('_').cat(ee.Number(meters.get(1)).divide(o.blockSize).floor().format('%d'));
    return f.set({source_id:id, split_key:o.split === 'spatial' ? block : id,
      reference_lon:xy.get(0), reference_lat:xy.get(1)});
  });
  if (o.sampling === 'fixed') refs=refs.randomColumn('sample_u',o.seed,'uniform',['source_id']).sort('sample_u').limit(o.maxSamples);
  return refs.randomColumn('split_u', o.seed + 1, 'uniform', ['split_key']).sort('source_id');
};
exports.prepare = function(options, points) {
  var o = config.normalize(options), geom = geometry(o.aoi);
  if(o.predictor_model === 'model1') throw new Error('Use run() for the original predictor set.');
  var region = o.buffer ? geom.buffer(o.buffer, 1) : geom;
  var stack = predictors(o, region);
  var mask = masks.ForestMasking(region, o.mask, o.year);
  var image = stack.image.updateMask(mask);
  points = points || exports.referencePoints(o);
  if (o.maxReferenceHeight !== null) points = ee.FeatureCollection(points).filter(ee.Filter.lte('rh',o.maxReferenceHeight));
  // Point geometries and source_id survive this operation unchanged.
  var samples = image.reduceRegions({collection:points, reducer:ee.Reducer.first(),
    scale:o.sampling === 'legacy' ? sampling.settings(geom.area(1).divide(10000).round()).scale : o.predictorScale, crs:o.sampleCrs || 'EPSG:4326',
    tileScale:4})
    .filter(ee.Filter.notNull(image.bandNames().add('rh')));
  return {options:o, geometry:geom, image:image, samples:samples, diagnostics:stack.diagnostics};
};
function classifier(o, train, bands) {
  var model, p;
  if (o.model === 'RF') {
    p = {numberOfTrees:o.numTreesRF, seed:o.seed};
    [['varSplitRF','variablesPerSplit'],['minLeafPopuRF','minLeafPopulation'],
      ['bagFracRF','bagFraction'],['maxNodesRF','maxNodes']].forEach(function(pair) {
      if (o[pair[0]] !== undefined) p[pair[1]] = o[pair[0]];
    });
    model = ee.Classifier.smileRandomForest(p);
  } else if (o.model === 'GBM') {
    p = {numberOfTrees:o.numTreesGBM, seed:o.seed, loss:o.lossGBM};
    [['shrGBM','shrinkage'],['samLingRateGBM','samplingRate'],['maxNodesGBM','maxNodes']]
      .forEach(function(pair) { if (o[pair[0]] !== undefined) p[pair[1]] = o[pair[0]]; });
    model = ee.Classifier.smileGradientTreeBoost(p);
  } else {
    p = {};
    if (o.maxNodesCART !== undefined) p.maxNodes = o.maxNodesCART;
    if (o.minLeafPopCART !== undefined) p.minLeafPopulation = o.minLeafPopCART;
    model = ee.Classifier.smileCart(p);
  }
  return model.setOutputMode('REGRESSION').train({features:train, classProperty:'rh', inputProperties:bands});
}
// Stage 2 entry point: reuse verified predictor samples instead of sampling again.
// The caller must supply the matching image and the exact predictor band order.
// Training/test membership is retained; no random split is regenerated.
exports.prepareFromSamples = function(options, predictorImage, samples, bands) {
  if (!Array.isArray(bands) || bands.length === 0) throw new Error('Provide the ordered predictor bands');
  var reserved = ['rh','classification','source_id','split_u','sample_u','split_key'];
  bands.forEach(function(b,i) {
    if (typeof b !== 'string' || !b || bands.indexOf(b) !== i || reserved.indexOf(b) >= 0)
      throw new Error('Invalid, duplicate or reference band: ' + b);
  });
  var o = config.normalize(options);
  return {options:o,geometry:geometry(o.aoi),image:ee.Image(predictorImage).select(bands),
    samples:o.maxReferenceHeight === null ? ee.FeatureCollection(samples) : ee.FeatureCollection(samples).filter(ee.Filter.lte('rh',o.maxReferenceHeight)),bandNames:ee.List(bands),
    diagnostics:{materialized_samples:true}};
};
exports.partitions = function(prepared) {
  var o = prepared.options, samples = prepared.samples;
  var cutoff = o.trainFraction;
  return {training:samples.filter(ee.Filter.lt('split_u', o.trainFraction)).sort('source_id'),
    test:samples.filter(ee.Filter.gte('split_u', cutoff)).sort('source_id')};
};
exports.fit = function(prepared) {
  var o = prepared.options, parts = exports.partitions(prepared);
  var bands = prepared.bandNames || prepared.image.bandNames();
  var trained = classifier(o, parts.training, bands);
  var originalBands = bands;
  var importance = ee.Dictionary(trained.explain().get('importance', ee.Dictionary({})));
  var scores = originalBands.map(function(b) { return ee.Number(importance.get(ee.String(b),0)).max(0); });
  var totalImportance = ee.Number(scores.reduce(ee.Reducer.sum()));
  var screeningPercent = ee.Dictionary.fromLists(originalBands,scores.map(function(v) {
    return ee.Number(v).divide(totalImportance.max(1e-30)).multiply(100);
  }));
  if (o.selection !== 'none') {
    // Training-only importance screening, followed by at most one reduced fit.
    // Mean threshold heuristic: SelectFromModel documentation, not Boruta.
    // https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.SelectFromModel.html
    var candidates;
    if (o.selection === 'mean') {
      var cutoff = totalImportance.divide(originalBands.size());
      candidates = originalBands.map(function(b) {
        return ee.Algorithms.If(ee.Number(importance.get(ee.String(b),0)).gte(cutoff),b,null);
      },true);
    } else {
      candidates = originalBands.sort(scores).reverse().slice(0,o.top_n_vars);
    }
    // Missing/zero importance cannot support screening: retain all predictors.
    bands = ee.List(ee.Algorithms.If(totalImportance.gt(0),candidates,originalBands));
    trained = ee.Classifier(ee.Algorithms.If(bands.size().lt(originalBands.size()),
      classifier(o,parts.training,bands),trained));
  }
  var retainedImportance = ee.Number(bands.map(function(b) {
    return screeningPercent.get(ee.String(b));
  }).reduce(ee.Reducer.sum()));
  var prediction = prepared.image.select(bands).classify(trained).rename('predicted').clip(prepared.geometry);
  var test = parts.test.classify(trained).map(function(f) {
    var e = ee.Number(f.get('classification')).subtract(f.get('rh'));
    return f.set({_error:e, _squared:e.pow(2), _absolute:e.abs()});
  });
  var n = test.size();
  var mse = ee.Number(ee.Algorithms.If(n.gt(0), test.aggregate_mean('_squared'), 0));
  var mean = ee.Number(ee.Algorithms.If(n.gt(0), test.aggregate_mean('rh'), 0));
  var rmse = mse.sqrt();
  var sst = ee.Number(test.map(function(f) {
    return f.set('_sst', ee.Number(f.get('rh')).subtract(mean).pow(2));
  }).aggregate_sum('_sst'));
  var metrics = ee.Dictionary({
    reference_height_max_m:o.maxReferenceHeight,
    selection_method:o.selection, predictors_original:originalBands.size(), predictors_selected:bands.size(),
    selected_predictors:bands, importance_available:totalImportance.gt(0),
    selection_threshold_percent: o.selection === 'mean' ? ee.Number(100).divide(originalBands.size()) : null,
    retained_screening_importance_percent:ee.Algorithms.If(totalImportance.gt(0),retainedImportance,null),
    test_n:n, training_n:parts.training.size(), 
    rmse_m:ee.Algorithms.If(n.gt(0), rmse, null),
    r2:ee.Algorithms.If(n.gt(1).and(sst.gt(0)), ee.Number(1).subtract(mse.multiply(n).divide(sst.max(1e-10))), null),
    rmse_percent:ee.Algorithms.If(n.gt(0).and(mean.neq(0)), rmse.divide(mean.abs().max(1e-10)).multiply(100), null),
    mae_m:ee.Algorithms.If(n.gt(0), test.aggregate_mean('_absolute'), null),
    bias_m:ee.Algorithms.If(n.gt(0), test.aggregate_mean('_error'), null)
  });
  var resultImage = prediction;
  resultImage = resultImage.set({
    pipeline_version:o.pipeline_version, dataset_option:o.dataset_option, dem_source:o.dem_source,
    model:o.model, year:o.year, selection:o.selection, top_n_vars:o.top_n_vars, split:o.split, seed:o.seed,
    s1_composite:o.s1_composite, s2_composite:o.s2_composite,
    training_n:parts.training.size(), test_n:n,
    metrics:metrics
  });
  return {image:resultImage, classifier:trained, bands:bands, metrics:metrics, screeningImportance:screeningPercent,
    validation:test, partitions:parts, prepared:prepared, options:o};
};
exports.run = function(options) {
 var o=config.normalize(options);
 return o.predictor_model === 'model1' ? exports.runOriginal(o) : exports.fit(exports.prepare(o));
};
// Recommended interactive function: use the same materialized samples as the app.
// callback(result, error). For large batch graphs use run(options) instead.
exports.runAsync=function(options,callback){
 var o;
 try{o=config.normalize(options);}catch(e){callback(null,e.message);return;}
 if(o.predictor_model==='model1'){
  geometry(o.aoi).area(1).divide(10000).round().evaluate(function(area,error){
   if(error){callback(null,error);return;}try{o.areaHa=area;callback(exports.run(o),null);}catch(e){callback(null,e.message);}
  });return;
 }
 var p;try{p=exports.prepare(o);}catch(e){callback(null,e.message);return;}
 exports.samplePayload(p).evaluate(function(payload,error){
  if(error){callback(null,error);return;}
  try{
   if(payload.rows.length>50000)throw new Error('More than 50,000 samples: use a smaller AOI or the deferred run() for batch computation.');
   var train=payload.rows.filter(function(r){return r.split_u<0.7;}).length;
   if(train<20||payload.rows.length-train<5)throw new Error('Too few usable training/testing observations.');
   var rows=ee.FeatureCollection(payload.rows.map(function(r){return ee.Feature(null,r);}));
   callback(exports.fit(exports.prepareFromSamples(o,p.image,rows,payload.bands)),null);
  }catch(e){callback(null,e.message);}
 });
};
// Compatibility with the previously consolidated array-returning API.
exports.CanopyHeightMapper = function(options) {
  var result = exports.run(options);
  print('CH-GEE metrics', result.metrics);
  return [result.image];
};


// Bounded app payload: extract the reference/predictor table once, without geometries.
exports.samplePayload = function(prepared) {
  return ee.Dictionary({bands:prepared.image.bandNames(),
    rows:prepared.samples.toList(prepared.options.sampling !== 'fixed' ? 50001 : prepared.options.maxSamples).map(function(f) {
      return ee.Feature(f).toDictionary();
    })});
};
exports.reportPayload = function(result) {
  var explanation = ee.Dictionary(result.classifier.explain());
  return ee.Dictionary({metrics:result.metrics, screening_importance_percent:result.screeningImportance,
    predictions:result.validation.limit(1500) .toList(1500).map(function(f) {
      return ee.Feature(f).toDictionary(['rh','classification','source_id']);
    }), importance:explanation.get('importance',ee.Dictionary({}))});
};

// Adapter for the unchanged original training/predictor workflow.
exports.runOriginal=function(options){
 var o=config.normalize(options),raw=legacy.run(o),n=raw.validation.size();
 var test=raw.validation.map(function(f){var e=ee.Number(f.get('classification')).subtract(f.get('rh'));return f.set({_error:e,_squared:e.pow(2),_absolute:e.abs()});});
 var mean=ee.Number(test.aggregate_mean('rh')),mse=ee.Number(test.aggregate_mean('_squared')),rmse=mse.sqrt();
 var sst=ee.Number(test.map(function(f){return f.set('_sst',ee.Number(f.get('rh')).subtract(mean).pow(2));}).aggregate_sum('_sst'));
 var metrics=ee.Dictionary({selection_method:'none',predictors_original:raw.bands.size(),predictors_selected:raw.bands.size(),selected_predictors:raw.bands,
  training_n:raw.training.size(),test_n:n,rmse_m:rmse,rmse_percent:ee.Algorithms.If(mean.neq(0),rmse.divide(mean.abs()).multiply(100),null),
  r2:ee.Algorithms.If(n.gt(1).and(sst.gt(0)),ee.Number(1).subtract(mse.multiply(n).divide(sst.max(1e-10))),null),mae_m:test.aggregate_mean('_absolute'),bias_m:test.aggregate_mean('_error')});
 return {image:raw.image.rename('predicted').clip(geometry(o.aoi)),classifier:raw.classifier,bands:raw.bands,metrics:metrics,
  screeningImportance:ee.Dictionary({}),validation:test,partitions:{training:raw.training,test:test},options:o,
  prepared:{geometry:geometry(o.aoi),options:o}};
};
