// CH-GEE public app: view maps and diagnostics. Exports live in Run_And_Export.js.
var mapper = require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var config = require('users/calvites1990/CH-GEE_Improved:Config');
var plots = require('users/calvites1990/CH-GEE_Improved:ForPlots');
var accent = '#43A5BE';
var background = '#424457';
var recipes = {
 'Pred 1 · S1 + S2 + GMTED': {id:'model1',note:'Original CH-GEE: Sentinel-1 mean, Sentinel-2 median and GMTED2010 topography (~232 m). 17 predictors; no variable selection.'},
 'Pred 2 · S1 + S2 + COP + XY': {id:'model2',note:'Sentinel-1/2 medians + Copernicus DEM topography (30 m) + geographic coordinates. 19 candidates; mean-importance selection.'},
 'Pred 3 · AlphaEarth + COP + XY': {id:'model3',note:'Annual AlphaEarth embeddings + Copernicus DEM topography (30 m) + geographic coordinates. 69 candidates; mean-importance selection.'}
};
function themedLabel(value,style,url) {
  var theme = {backgroundColor:background,color:'#ffffff',fontFamily:'sans-serif'};
  Object.keys(style || {}).forEach(function(k) { theme[k] = style[k]; });
  return ui.Label(value,theme,url);
}
var appMap=ui.Map();appMap.setControlVisibility({zoomControl:true});
var panel = ui.Panel({style:{width:'410px',padding:'12px',backgroundColor:background}});
var sidebar = panel;
var sections = [];
var footer = ui.Panel({style:{padding:'6px',margin:'6px 0',backgroundColor:'#36384b'}});
var results = ui.Panel({style:{position:'bottom-left',width:'370px',maxHeight:'390px',backgroundColor:'#fffffff0',padding:'10px',shown:false}});
var status = themedLabel('Choose an area, then run the mapper.',{color:'#e2e4eb',whiteSpace:'pre-wrap'});
function heading(title,opened) {
 var body = ui.Panel({style:{shown:!!opened,backgroundColor:background,margin:'0',padding:'0 4px'}});
 var toggle = ui.Button({label:opened ? '−' : '+',
   style:{width:'32px',margin:'0',padding:'0',color:'#424457'},
   onClick:function() {
     var show = !body.style().get('shown');
     body.style().set('shown',show); toggle.setLabel(show ? '−' : '+');
   }});
 var row = ui.Panel({layout:ui.Panel.Layout.flow('horizontal'),
   style:{stretch:'horizontal',backgroundColor:background,margin:'4px 0',padding:'2px 0'}});
 row.add(themedLabel(title,{fontSize:'16px',fontWeight:'normal',color:'#FFFF33',stretch:'horizontal',margin:'4px 0'}));
 row.add(toggle);
 sidebar.add(row); sidebar.add(body); sections.push({body:body,toggle:toggle}); panel = body;
}
function field(label,widget) {
 var group = ui.Panel({style:{backgroundColor:background,stretch:'horizontal'}});
 group.add(themedLabel(label,{fontSize:'14px',color:'#80c3d4',margin:'8px 0 4px 0'})); group.add(widget);
 panel.add(group); widget.fieldGroup = group; return widget;
}
function text(value) { return ui.Textbox({value:String(value),style:{stretch:'horizontal',margin:'0',fontSize:'14px'}}); }
function select(items,value) { return ui.Select({items:items,value:value,style:{stretch:'horizontal',margin:'0',fontSize:'14px'}}); }
panel.add(themedLabel('Canopy Height Mapper',{fontSize:'23px',fontWeight:'normal',color:'#7ED63C'}));
panel.add(themedLabel('CH-GEE Improved · Google Earth Engine',{fontSize:'13px',color:accent,margin:'0 0 12px'},'https://github.com/Cesarito2021/CH-GEE'));
heading('Spatial extent settings',true);
var mode = field('Area of interest',select(['Earth Engine asset','Draw polygon'],'Earth Engine asset'));
var asset = field('Polygon asset ID',text('projects/ee-calvites1990/assets/aoi_sardinia_4326'));
var drawing = appMap.drawingTools(); drawing.setShown(false);
var draw = ui.Button({label:'Draw area of interest',style:{stretch:'horizontal',margin:'6px 0'},onClick:function() {
  drawing.setShown(true); drawing.layers().reset(); drawing.setShape('polygon'); drawing.draw(); mode.setValue('Draw polygon');
}});
panel.add(draw);
draw.style().set('shown',false);
mode.onChange(function(value) {
 var useAsset = value === 'Earth Engine asset'; asset.fieldGroup.style().set('shown',useAsset); draw.style().set('shown',!useAsset); drawing.setShown(!useAsset);
});
panel.add(themedLabel('Preview limit: 30,000 ha. Original CH-GEE sampling by area.',
  {fontSize:'13px',color:'#e2e4eb',whiteSpace:'pre-wrap'}));
heading('Data settings');
var forest = field('Forest mask',select(['none','DW','FNF'],'none'));
var dataset = field('Predictor set',select(Object.keys(recipes),'Pred 3 · AlphaEarth + COP + XY'));
var recipeNote = themedLabel('',{fontSize:'14px',whiteSpace:'pre-wrap',margin:'8px 0'}); panel.add(recipeNote);
var rh = field('GEDI target · relative height',select(['rh75','rh90','rh95','rh98','rh100','Mean RH75/90/95/100'],'rh95'));
var beams = field('GEDI beams',select(['All beams','Strong / full power','Weak / coverage'],'All beams'));
var acquisition = field('GEDI acquisition',select(['Day + night','Nighttime','Daytime'],'Day + night'));
panel.add(themedLabel('Quality filtering: quality flag = 1; degrade flag = 0. Pred 2 and 3: reference RH ≤ 50 m.',{fontSize:'13px',whiteSpace:'pre-wrap'}));
// Matching date boxes; GEDI dates are independent and may span several years.
function timeRow() {
 var row=ui.Panel({layout:ui.Panel.Layout.flow('horizontal'),style:{backgroundColor:background,margin:'0',padding:'0',stretch:'horizontal'}});
 panel.add(row);return row;
}
function timeField(row,label,value) {
 var group=ui.Panel({style:{backgroundColor:background,width:'170px',margin:'0 4px 0 0',padding:'0'}});
 group.add(themedLabel(label,{fontSize:'14px',color:'#80c3d4',margin:'8px 0 4px'}));
 var input=text(value);input.style().set({height:'32px',padding:'0'});
 group.add(input);row.add(group);input.fieldGroup=group;return input;
}
panel.add(themedLabel('GEDI reference period',{fontSize:'14px',color:'#FFFF33',margin:'12px 0 0'}));
var gediDates=timeRow();
var gs = timeField(gediDates,'Start · YYYY-MM-DD','2019-01-01');
var ge = timeField(gediDates,'End · YYYY-MM-DD','2020-12-31');
panel.add(themedLabel('May span multiple years. End date is exclusive.',{fontSize:'12px',color:'#e2e4eb',margin:'4px 0 8px',whiteSpace:'pre-wrap'}));
panel.add(themedLabel('Predictor period',{fontSize:'14px',color:'#FFFF33',margin:'12px 0 0'}));
var year = timeField(timeRow(),'Map year',2019);
var seasonDates=timeRow();
var start = timeField(seasonDates,'Start · MM-DD','04-01');
var end = timeField(seasonDates,'End · MM-DD','09-30');
var seasonNote=themedLabel('Sentinel-2 season; end date is exclusive.',{fontSize:'12px',color:'#e2e4eb',margin:'4px 0 8px',whiteSpace:'pre-wrap'});panel.add(seasonNote);
var clouds = field('Maximum scene cloud cover (%)',ui.Slider({min:0,max:100,value:30,step:1,
 style:{stretch:'horizontal',margin:'0',color:'#ffffff',backgroundColor:background}}));
heading('Model parameter settings');
var model = field('Algorithm',select(['RF','GBM','CART'],'RF'));
var trees = field('Number of trees (RF / GBM)',text(500));
model.onChange(function(value) { trees.fieldGroup.style().set('shown',value !== 'CART'); });
var advanced = ui.Panel({style:{shown:false,backgroundColor:background}});
var advancedToggle = ui.Checkbox({label:'Advanced model settings',value:false,style:{backgroundColor:background,color:'#ffffff'},
  onChange:function(value) { advanced.style().set('shown',value); }});
panel.add(advancedToggle); panel.add(advanced);
var hyper = {};
[
 ['varSplitRF','RF variables per split',''],['minLeafPopuRF','RF minimum leaf population','1'],
 ['bagFracRF','RF bag fraction','0.5'],['maxNodesRF','RF maximum leaf nodes',''],
 ['shrGBM','GBM shrinkage','0.005'],['samLingRateGBM','GBM sampling rate','0.7'],
 ['maxNodesGBM','GBM maximum leaf nodes',''],['maxNodesCART','CART maximum leaf nodes',''],
 ['minLeafPopCART','CART minimum leaf population','1']
].forEach(function(spec) {
  advanced.add(themedLabel(spec[1],{fontSize:'14px'})); hyper[spec[0]] = text(spec[2]); advanced.add(hyper[spec[0]]);
});
var loss = select(['LeastAbsoluteDeviation','LeastSquares','Huber'],'LeastAbsoluteDeviation');
advanced.add(themedLabel('GBM loss')); advanced.add(loss);
var selectionNote=themedLabel('',{fontSize:'13px',whiteSpace:'pre-wrap'});panel.add(selectionNote);
function updateRecipe(){
 var entry=recipes[dataset.getValue()],sentinel=entry.id!=='model3',original=entry.id==='model1';recipeNote.setValue(entry.note);
 [start,end,clouds].forEach(function(w){w.fieldGroup.style().set('shown',sentinel);});
 seasonDates.style().set('shown',sentinel);seasonNote.style().set('shown',sentinel);
 [beams,acquisition].forEach(function(w){w.fieldGroup.style().set('shown',!original);});
 selectionNote.setValue(original?'Original predictor set: all 17 variables; original 70/30 split.':'Variable selection: retain at least mean importance. Training/testing: 70/30.');
}
dataset.onChange(updateRecipe);updateRecipe();
heading('Map display');
var paletteChoice=field('Colour palette',select(['Viridis','Forest','CH-GEE classic'],'Viridis'));
var autoRange=ui.Checkbox({label:'Auto range from test predictions',value:true,style:{backgroundColor:background,color:'#ffffff'}});panel.add(autoRange);
var maximum=field('Display maximum height (m)',ui.Slider({min:5,max:100,value:30,step:1,style:{stretch:'horizontal',backgroundColor:background,color:'#ffffff'}}));
panel.add(themedLabel('Colours change the display only. Predicted heights remain unchanged.',{fontSize:'13px',whiteSpace:'pre-wrap'}));
var heightLayer=null,currentReport=null,generation=0,sampleCache=null,completed=null;
var legend=ui.Panel(),chartChoice=select(['Scatter plot','Variable importance','Metrics'],'Scatter plot');
var progress=ui.Label('Choose an area, then run.',{fontSize:'13px',whiteSpace:'pre-wrap',backgroundColor:'#ffffff00'});
function setStatus(value){status.setValue(value);progress.setValue(value);}
function mountMap(){appMap.style().set({stretch:'both',width:sidebar.style().get('shown')?'calc(100% - 410px)':'100%'});ui.root.widgets().reset([appMap,sidebar]);}
function setMenu(shown){var changed=sidebar.style().get('shown')!==shown;sidebar.style().set('shown',shown);drawing.setShown(shown&&mode.getValue()==='Draw polygon');if(changed)mountMap();}
function format(value,digits){return typeof value==='number'&&isFinite(value)?value.toFixed(digits):'—';}
function chartLabel(value){return ui.Label(value,{fontSize:'14px',color:'#263238',backgroundColor:'#ffffff00',whiteSpace:'pre-wrap',margin:'3px 0'});}
function drawChart(){
 results.clear();if(!currentReport)return;var m=currentReport.metrics;
 results.add(chartLabel(currentReport.title+'\nRMSE '+format(m.rmse_m,2)+' m · '+format(m.rmse_percent,1)+'% · R² '+format(m.r2,3)));
 results.add(chartLabel('Predictors: '+m.predictors_selected+' / '+m.predictors_original));
 if(chartChoice.getValue()==='Scatter plot'){
  results.add(plots.scatterFromRows(currentReport.predictions));
  if(m.test_n>currentReport.predictions.length)results.add(chartLabel('Chart: first '+currentReport.predictions.length+' test rows. Metrics use all test rows.'));
 }else if(chartChoice.getValue()==='Variable importance')results.add(plots.importanceFromValues(currentReport.importance));
 else results.add(chartLabel('Training: '+m.training_n+' · Testing: '+m.test_n+'\nMAE: '+format(m.mae_m,2)+' m · Bias: '+format(m.bias_m,2)+' m\n'+(m.selected_predictors||[]).join(', ')));
}
function adjustAutoRange(){
 if(!autoRange.getValue()||!currentReport)return;
 var values=currentReport.predictions.map(function(r){return r.classification;}).filter(function(v){return typeof v==='number'&&isFinite(v);});
 if(values.length)maximum.setValue(Math.min(100,Math.max(5,Math.ceil(Math.max.apply(null,values)/5)*5)),false);
}
function updateDisplay(){
 var colors=plots.palettes[paletteChoice.getValue()],upper=maximum.getValue();
 if(heightLayer)heightLayer.setVisParams({min:0,max:upper,palette:colors});
 legend.clear();legend.add(plots.mapLegend(colors,'Canopy height',upper));
}
paletteChoice.onChange(updateDisplay);
maximum.onChange(function(){autoRange.setValue(false,false);updateDisplay();});
autoRange.onChange(function(){adjustAutoRange();updateDisplay();});
var chartToggle=ui.Checkbox({label:'Show results',value:true,onChange:function(value){results.style().set('shown',value&&!!currentReport);}});
chartChoice.onChange(function(){drawChart();if(currentReport){chartToggle.setValue(true,false);results.style().set('shown',true);}});
var controls=ui.Panel({style:{position:'top-left',width:'230px',padding:'8px',backgroundColor:'#fffffff0'}});
controls.add(ui.Label('CANOPY HEIGHT',{fontWeight:'bold',color:'#287c73',margin:'0 0 6px'}));
controls.add(ui.Button({label:'Settings',onClick:function(){setMenu(!sidebar.style().get('shown'));},style:{stretch:'horizontal',margin:'0 0 4px'}}));
controls.add(legend);controls.add(chartChoice);controls.add(chartToggle);controls.add(progress);appMap.add(controls);appMap.add(results);updateDisplay();
function fail(message,token){if(token!==generation)return;setMenu(true);setStatus('Unable to complete: '+message);run.setDisabled(false);}
function displayResult(result,report,title,area){
 appMap.layers().reset();currentReport={title:title,metrics:report.metrics,predictions:report.predictions,importance:report.importance};
 // The display is a separate graph; the returned product remains untouched.
 var coarse=result.options.predictor_model!=='model1';
 var preview=coarse?result.image.clip(result.prepared.geometry).reproject({crs:'EPSG:4326',scale:100}):result.image;
 adjustAutoRange();heightLayer=ui.Map.Layer(preview.select('predicted'),{min:0,max:maximum.getValue(),palette:plots.palettes[paletteChoice.getValue()]},'Canopy height',true);appMap.layers().add(heightLayer);
 updateDisplay();setMenu(false);drawChart();results.style().set('shown',chartToggle.getValue());
 var token=generation;ui.util.setTimeout(function(){if(token===generation)appMap.centerObject(result.prepared.geometry);},150);
 setStatus('Ready · '+Math.round(area/10000).toLocaleString()+' ha · '+report.metrics.test_n+' test points'+(coarse?'\nPreview: 100 m · product: 10 m':''));
 print('CH-GEE Improved · evaluation',report.metrics);run.setDisabled(false);
}
function runMapper(){
 var token=++generation;run.setDisabled(true);setMenu(false);setStatus('Checking settings and area…');
 try{
  var aoi;if(mode.getValue()==='Earth Engine asset'){
   if(!asset.getValue().trim())throw new Error('Enter a polygon asset ID.');aoi=ee.FeatureCollection(asset.getValue().trim());
  }else{if(!drawing.layers().length())throw new Error('Draw a polygon first.');aoi=ee.FeatureCollection([ee.Feature(drawing.layers().get(0).getEeObject())]);}
  var title=dataset.getValue(),metric=rh.getValue();
  var input={aoi:aoi,year:Number(year.getValue()),predictor_model:recipes[title].id,model:model.getValue(),numTreesRF:Number(trees.getValue()),numTreesGBM:Number(trees.getValue()),
   mask:forest.getValue(),start_date:start.getValue(),end_date:end.getValue(),startDateGEDI:gs.getValue(),endDateGEDI:ge.getValue(),cloudsTh:clouds.getValue(),
   quantile:metric.indexOf('Mean')===0?'rh95':metric,gedi_type:metric.indexOf('Mean')===0?'meanGEDI':'singleGEDI',
   beams:beams.getValue()==='All beams'?'all':beams.getValue()==='Strong / full power'?'strong':'weak',
   acquisition:acquisition.getValue()==='Day + night'?'all':acquisition.getValue()==='Nighttime'?'nighttime':'daytime',lossGBM:loss.getValue()};
  Object.keys(hyper).forEach(function(k){input[k]=hyper[k].getValue();});var options=config.normalize(input);
  var keys={};Object.keys(options).forEach(function(k){keys[k]=options[k];});keys.aoi=ee.Serializer.toJSON(aoi);var runKey=JSON.stringify(keys);
  if(completed&&completed.key===runKey){displayResult(completed.result,completed.report,title,completed.area);return;}
  ['model','numTreesRF','numTreesGBM','varSplitRF','minLeafPopuRF','bagFracRF','maxNodesRF','shrGBM','samLingRateGBM','maxNodesGBM','maxNodesCART','minLeafPopCART','lossGBM'].forEach(function(k){delete keys[k];});
  var sampleKey=JSON.stringify(keys);
  function evaluateResult(result,area){mapper.reportPayload(result).evaluate(function(report,error){
   if(token!==generation)return;if(error)return fail(error,token);
   if(!report.metrics.test_n||report.metrics.rmse_m===null)return fail('No usable testing observations. Adjust the area or dates.',token);
   completed={key:runKey,result:result,report:report,area:area};displayResult(result,report,title,area);
  });}
  function fitRows(prepared,payload,area){
   if(token!==generation)return;
   try{
    if(payload.rows.length>50000)return fail('More than 50,000 rows. Use the Code Editor function or a smaller area.',token);
    var nTrain=payload.rows.filter(function(r){return r.split_u<0.7;}).length,nTest=payload.rows.length-nTrain;
    if(nTrain<20||nTest<5)return fail('Too few usable points (training '+nTrain+', testing '+nTest+'). Adjust the area or dates.',token);
    var fc=ee.FeatureCollection(payload.rows.map(function(r){return ee.Feature(null,r);}));
    var result=mapper.fit(mapper.prepareFromSamples(options,prepared.image,fc,payload.bands));setStatus('Selecting variables, training and evaluating…');evaluateResult(result,area);
   }catch(e){fail(e.message,token);}
  }
  if(options.predictor_model!=='model1'&&sampleCache&&sampleCache.key===sampleKey){fitRows(sampleCache.prepared,sampleCache.payload,sampleCache.area);return;}
  aoi.geometry().area(1).evaluate(function(area,error){
   if(token!==generation)return;if(error)return fail(error,token);
   if(area<=0||area>3e8)return fail('Choose an area up to 30,000 ha. Larger areas: use the Code Editor function.',token);
   options.areaHa=Math.round(area/10000);
   try{
    appMap.centerObject(aoi);
    if(options.predictor_model==='model1'){setStatus('Running original CH-GEE predictors and training…');evaluateResult(mapper.run(options),area);return;}
    setStatus('Preparing predictors with CH-GEE buffered sampling…');var prepared=mapper.prepare(options);
    mapper.samplePayload(prepared).evaluate(function(payload,error){if(token!==generation)return;if(error)return fail(error,token);sampleCache={key:sampleKey,prepared:prepared,payload:payload,area:area};fitRows(prepared,payload,area);});
   }catch(e){fail(e.message,token);}
  });
 }catch(e){fail(e.message,token);}
}
var run=ui.Button({label:'Run canopy height mapper',onClick:runMapper,style:{stretch:'horizontal',margin:'0',color:'#287c73',fontWeight:'bold',fontSize:'14px'}});footer.add(run);
var reset=ui.Button({label:'Reset',style:{stretch:'horizontal',margin:'6px 0'},onClick:function(){generation++;sampleCache=null;completed=null;currentReport=null;heightLayer=null;appMap.layers().reset();results.clear();results.style().set('shown',false);setMenu(true);run.setDisabled(false);setStatus('Choose an area, then run the mapper.');}});footer.add(reset);
status.style().set({backgroundColor:'#36384b',fontSize:'13px',margin:'4px 0'});footer.add(status);
heading('About');
panel.add(themedLabel('CH-GEE research and documentation',{color:accent},'https://github.com/Cesarito2021/CH-GEE'));
panel.add(themedLabel('Viewing app. Code Editor functions are supplied separately. S1/S2 = Sentinel-1/2; COP = Copernicus topography; XY = longitude/latitude.',{fontSize:'13px',whiteSpace:'pre-wrap'}));
sidebar.add(footer);sidebar.style().set('shown',true);mountMap();appMap.setOptions('SATELLITE');appMap.centerObject(ee.FeatureCollection(asset.getValue()));

