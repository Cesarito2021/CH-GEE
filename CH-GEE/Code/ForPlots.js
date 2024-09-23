//***********************************************************************************************
//**************************** Calculating RMSE in meter and percentage   ***********************
//***********************************************************************************************

var CalculationRMSE = function(classifiedValidation) {
  // Get true values (observed) and predicted values
  var trueValues = ee.Array(classifiedValidation.aggregate_array('rh'));
  var predictedValues = ee.Array(classifiedValidation.aggregate_array('classification'));
  
  // Calculate RMSE
  var squaredErrors = trueValues.subtract(predictedValues).pow(2);
  var sumSquaredErrors = squaredErrors.reduce('sum', [0]).get([0]);
  var rmse = ee.Number(sumSquaredErrors.divide(trueValues.length().get([0])).sqrt());
  
  // Calculate RMSE in percentage
  var meanTrueValues = trueValues.reduce('mean', [0]).get([0]);
  var rmsePercentage = rmse.divide(meanTrueValues).multiply(100);
  
   var resultString = ee.String('RMSE: ').cat(rmse.format('%.2f')).cat(' m (').cat(rmsePercentage.format('%.2f')).cat('%)');
  //
  return resultString;
};
exports.CalculationRMSE = CalculationRMSE;

//***********************************************************************************************
//********************************* Plotting Scatter plot graph   *******************************
//***********************************************************************************************
var SCPLOT = function(dataset,RMSE){
  //
  RMSE  = RMSE.getInfo(); 
  // Converti la FeatureCollection in punti
  var points = dataset.map(function(feature) {
    return ee.Feature(ee.Geometry.Point([feature.get('B1'), feature.get('B2')])) 
      .set('pred', feature.get('classification')) 
      .set('ref', feature.get('rh')) 
  });
// Crea uno scatter plot utilizzando i punti
  var chart = ui.Chart.feature.byFeature(points, 'ref', 'pred')
    .setChartType('ScatterChart')
    .setOptions({
      title: "Scatter Plot",
      fontSize: 13,
      pointSize: 3,
      colors: ['1d6b99'],
      legend: { maxLines: 5, position: 'top' },
      series: {
        0: { targetAxisIndex: 0, titleTextStyle: { italic: false, bold: true } },
        1: { targetAxisIndex: 1, titleTextStyle: { italic: false, bold: true } }
      },
      vAxes: {
        // Aggiungi titoli agli assi.
        0: { title: 'Predicted Canopy Heights', titleTextStyle: { italic: false, bold: true, fontSize: 12  } },
        1: { title: 'Predicted Canopy Heights', titleTextStyle: { italic: false, bold: true, fontSize: 12  } }
      },
      hAxes: {
        // Aggiungi titoli agli assi.
        0: { title: 'Reference Canopy Heights', titleTextStyle: { italic: false, bold: true , fontSize: 11 } },
        1: { title: 'Reference Canopy Heights', titleTextStyle: { italic: false, bold: true , fontSize: 11 } }
      },
      trendlines: {
        0: {
          type: 'linear',
          color: 'lightblue',
          lineWidth: 3,
          opacity: 0.7,
          showR2: true,
          visibleInLegend: true
        }
      },
    });
    
    //
var panel = ui.Panel({
	style:{
		position: 'bottom-left',
		width:  '320px',//400px
		height: '270px',//250px
		textAlign: 'center',
		border: '1px solid black;',
		backgroundColor: 'rgba(255, 255, 255, 0.5)'}
	
}).add(chart);

var note = ui.Label({
	value:[RMSE], 
	style: {
		fontSize: '10px',
		padding: '10px:',
		border: '1px solid black',
		textAlign: 'center',
		position: 'top-right'
		}
});
panel.add(note);
Map.add(panel);
return(panel);
};
exports.SCPLOT = SCPLOT;

//***********************************************************************************************
//********************************* Plotting Variable Importance ********************************
//***********************************************************************************************

var VARIMP = function(dataset){
     var classifier    = ee.Classifier(dataset);  //* output data 
        var exp = classifier.explain();
      //
     var importance = ee.Dictionary(exp.get('importance'));
     var keys = importance.keys().sort(importance.values()).reverse();
     //
     var values = importance.values(keys);
        // 
     var rows = keys.zip(values).map(function(list) {
         return {c: ee.List(list).map(function(n) { return {v: n}; })};
      });
     //  
     var dataTable = {
       cols: [{id: 'Predictor Variables', label: 'Band', type: 'string'},
              {id: 'Importance', label: 'Importance', type: 'number'}],
       rows: rows.getInfo()
     };
     // 
  //
     var chart = ui.Chart(dataTable).setChartType('ColumnChart').setOptions({
       title: 'Variable Importance Plot',
       fontSize: 13,
       legend: {position: 'none'},
       hAxis: {title: 'Predictor Variables', titleTextStyle: {italic: false, bold: true, fontSize: 11 }},
       vAxis: {title: 'Importance', titleTextStyle: {italic: false, bold: true, fontSize: 11}},
       colors: ['1d6b99'],
       
     });
     var panel = ui.Panel({ style:{
     position: 'bottom-right',
     width: '370px',//400px
     height: '240px',//250px
     textAlign: 'center',
     border: '1px solid black;',
     backgroundColor: 'rgba(255, 255, 255, 0.5)'}}).add(chart);
     Map.add(panel);
};
 exports.VARIMP = VARIMP;
//***********************************************************************************************
//********************** Configurating Color Palette for Canopy Height Map **********************
//***********************************************************************************************

var scalecolor = function(min,max,classified_clip){
 var palettes = require('users/gena/packages:palettes');
 var visParam = {min: min,max: max ,palette: palettes.matplotlib.viridis[7].reverse()} 
  Map.addLayer(classified_clip,visParam,'Canopy Height');
       // Set up the type of palette
   var palette = palettes.cmocean.Speed[7];
   var vis = visParam;
   // Set up number of differents levels of colors
   var nSteps = 20
   // Creates a color bar thumbnail image for use in legend from the given color palette
   function makeColorBarParams(palette) {
     return {
       bbox: [0, 0, nSteps, 0.1],
       dimensions: '200x10',
       format: 'png',
       min: 0,
       max: nSteps,
       palette: palette,
     };
   }
    // Create the colour bar for the legend
   var colorBar = ui.Thumbnail({
     image: ee.Image.pixelLonLat().select(0).int(),
     params: makeColorBarParams(vis.palette),
     style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
   });
    // Create a panel with three numbers for the legend
   var legendLabels = ui.Panel({
     widgets: [
       ui.Label(vis.min, {margin: '6px 10px'}),//{margin: '4px 8px'}),
       ui.Label(((vis.max-vis.min) / 2+vis.min),
           {margin: '6px 10px', textAlign: 'center', stretch: 'horizontal'}),
       ui.Label(vis.max, {margin: '6px 10px'})
     ],
     layout: ui.Panel.Layout.flow('horizontal'),
      });
   // Legend title
   var legendTitle = ui.Label({
     value: 'Canopy Height Map (m)',
     style: {fontWeight: 'bold'}
   });
   // Add the legendPanel to the map
   var legendPanel = ui.Panel([legendTitle, colorBar, legendLabels]);
   Map.add(legendPanel);}
   exports.scalecolor = scalecolor;
 
//********************************************* End **********************************************



