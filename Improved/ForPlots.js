// Presentation helpers; all server requests use charts/evaluate, never getInfo.
var palette = ['440154','443983','31688e','21918c','35b779','90d743','fde725'];
exports.palette = palette;
exports.palettes = {
  'CH-GEE classic': palette.slice().reverse(),
  'Viridis': palette,
  'Forest': ['ffffcc','d9f0a3','addd8e','78c679','41ab5d','238443','005a32']
};
function transparentChart(chart) { chart.style().set({backgroundColor:'#ffffff00',margin:'0'}); return chart; }
// Charts from already evaluated results: no Earth Engine requests or re-training.
exports.scatterFromRows = function(rows) {
  var data = [['Observed','Predicted','1:1']];
  rows.slice().sort(function(a,b) { return a.rh-b.rh; }).forEach(function(f) {
    data.push([f.rh,f.classification,f.rh]);
  });
  return transparentChart(ui.Chart({dataTable:data,chartType:'ScatterChart',downloadable:false,options:{
    backgroundColor:{fill:'transparent'},titleTextStyle:{color:'#263238'},title:'Observed vs predicted',height:220,pointSize:3,legend:{position:'none'},
    colors:['#287c73','#777777'],series:{0:{pointSize:3,lineWidth:0},1:{pointSize:0,lineWidth:1}},
    hAxis:{title:'GEDI height (m)',textStyle:{color:'#37474f'},titleTextStyle:{color:'#263238'}},vAxis:{title:'Predicted height (m)',textStyle:{color:'#37474f'},titleTextStyle:{color:'#263238'}},
    chartArea:{left:48,top:35,width:'72%',height:'65%'}}}));
};
exports.importanceFromValues = function(values) {
  if (!values || !Object.keys(values).length) return ui.Label('Importance is unavailable for this algorithm.');
  var allKeys = Object.keys(values).filter(function(k) { return typeof values[k] === 'number' && isFinite(values[k]) && values[k] >= 0; });
  var total = allKeys.reduce(function(sum,k) { return sum+values[k]; },0);
  if (!total) return ui.Label('No positive predictor importance is available.');
  var keys = allKeys.sort(function(a,b) { return values[b]-values[a]; }).slice(0,15);
  var data = [['Predictor','Relative importance (%)']];
  keys.forEach(function(k) { data.push([k,100*values[k]/total]); });
  return transparentChart(ui.Chart({dataTable:data,chartType:'BarChart',downloadable:false,options:{
    backgroundColor:{fill:'transparent'},titleTextStyle:{color:'#263238'},hAxis:{title:'Relative importance (%)',textStyle:{color:'#37474f'}},vAxis:{textStyle:{color:'#37474f'}},title:'Predictor importance · top 15',height:240,legend:{position:'none'},colors:['#287c73'],
    chartArea:{left:100,top:38,width:'62%',height:'76%'}}}));
};
exports.scatter = function(validation) {
  var displayed = validation.limit(1500).map(function(f) { return f.set('identity',f.get('rh')); }).sort('rh');
  return ui.Chart.feature.byFeature(displayed, 'rh', ['classification','identity'])
    .setChartType('ScatterChart').setOptions({
      title:'Observed and predicted canopy height', pointSize:3,
      colors:['287c73','777777'], legend:{position:'none'},
      series:{0:{pointSize:3,lineWidth:0},1:{pointSize:0,lineWidth:1}},
      hAxis:{title:'GEDI reference height (m)'}, vAxis:{title:'Predicted height (m)'},
      tooltip:{trigger:'focus'}
    });
};
exports.importance = function(classifier) {
  var imp = ee.Dictionary(classifier.explain().get('importance'));
  var rows = ee.FeatureCollection(imp.keys().map(function(k) {
    return ee.Feature(null, {predictor:k, importance:imp.get(k)});
  })).sort('importance',false).limit(25);
  return ui.Chart.feature.byFeature(rows,'predictor',['importance'])
    .setChartType('BarChart').setOptions({title:'Predictor importance (top 25)',
      colors:['#287c73'], legend:{position:'none'}});
};
exports.legend = function(selectedPalette) {
  var colors = selectedPalette || palette;
  var bar = ui.Thumbnail({image:ee.Image.pixelLonLat().select(0),
    params:{bbox:[0,0,50,1],dimensions:'240x12',min:0,max:50,palette:colors},
    style:{stretch:'horizontal',maxHeight:'18px'}});
  var ticks = ui.Panel([ui.Label('0'),ui.Label('25',{stretch:'horizontal',textAlign:'center'}),ui.Label('50')],
    ui.Panel.Layout.flow('horizontal'));
  return ui.Panel([ui.Label('Canopy height (m)',{fontWeight:'bold'}),bar,ticks],
    null,{position:'bottom-left',padding:'8px',backgroundColor:'#ffffffee'});
};
// Compatibility helpers for older scripts in the improved repository.
exports.CalculationRMSE = function(data) {
  var residuals = data.map(function(f) {
    return f.set('_sq',ee.Number(f.get('rh')).subtract(f.get('classification')).pow(2));
  });
  return ee.String('RMSE: ').cat(ee.Number(residuals.aggregate_mean('_sq')).sqrt().format('%.2f')).cat(' m');
};
exports.SCPLOT = function(data, rmse) {
  var label = ui.Label('Calculating RMSE…'), panel = ui.Panel([exports.scatter(data),label]);
  rmse.evaluate(function(value,error) { label.setValue(error ? 'RMSE failed: ' + error : value); });
  Map.add(panel); return panel;
};
exports.VARIMP = function(model) { var panel = ui.Panel([exports.importance(model)]); Map.add(panel); return panel; };
exports.scalecolor = function(min,max,image,label) {
  Map.addLayer(image.select('predicted'),{min:min,max:max,palette:palette},label || 'Canopy height');
  Map.add(exports.legend());
};


// Lightweight on-map legend: local color swatches, no thumbnail request.
exports.mapLegend = function(colors,title,max) {
  var swatches=ui.Panel({layout:ui.Panel.Layout.flow('horizontal'),style:{stretch:'horizontal',backgroundColor:'#ffffff00',margin:'0'}});
  colors.forEach(function(color) { swatches.add(ui.Label('',{backgroundColor:'#'+color,height:'9px',stretch:'horizontal',margin:'0',padding:'0'})); });
  return ui.Panel([ui.Label(title,{fontWeight:'bold',fontSize:'11px',margin:'4px 0',backgroundColor:'#ffffff00'}),swatches,
    ui.Panel([ui.Label('0',{fontSize:'10px',margin:'2px 0',backgroundColor:'#ffffff00',stretch:'horizontal'}),ui.Label(max+' m',{fontSize:'10px',margin:'2px 0',backgroundColor:'#ffffff00',textAlign:'right',stretch:'horizontal'})],ui.Panel.Layout.flow('horizontal'),{backgroundColor:'#ffffff00',stretch:'horizontal',margin:'0'})],null,{backgroundColor:'#ffffff00',margin:'0'});
};

