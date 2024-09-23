//***************************************************************************************************************
//********************************************* Canopy Height Mapper  *******************************************
//***************************************************************************************************************

var CanopyHeightMapper = function(aoi, year, start_date, end_date,startDateGEDI,endDateGEDI, quantile, model, mask, gedi_type,
numTreesRF,varSplitRF,minLeafPopuRF,bagFracRF,maxNodesRF,numTreesGBM,shrGBM,samLingRateGBM,maxNodesGBM,lossGBM,maxNodesCART,minLeafPopCART){
  
  //***************************************************************************************************************
  //  Input Data
  //***************************************************************************************************************

  var startDateWithYear = year+"-"+start_date; 
  var endDateWithYear   = year+"-"+end_date;
  
  //***************************************************************************************************************
  //  Importing Area of Insterest (AOI) through drawing or uploading
  //***************************************************************************************************************

  var aoi2 = ee.Geometry(ee.FeatureCollection(aoi).geometry())//.geometries()
  var polygonArea = aoi2.area({'maxError': 1});
  polygonArea = (polygonArea.divide(10000).round()).getInfo();
  
  //***************************************************************************************************************
  //  Adjusting the Visualization Settings for the AOI
  //***************************************************************************************************************
  
  if(polygonArea < 2000 ){var scale = 10
  Map.centerObject(aoi, 14)}
  else if(polygonArea >= 2000 & polygonArea < 10000){
    scale = 50
    Map.centerObject(aoi, 12)}
  else if(polygonArea >= 10000 & polygonArea < 20000){
    scale = 100
    Map.centerObject(aoi, 10)}
  else if(polygonArea >= 10000 & polygonArea < 330000){
    scale = 100
    Map.centerObject(aoi, 8);
  }else if(polygonArea >= 330000 & polygonArea < 2200000){ 
    scale = 200
    Map.centerObject(aoi, 8);
  }else if(polygonArea >= 2200000 & polygonArea < 10000000){ 
    scale = 250
    Map.centerObject(aoi, 8);
  }else {scale = 250
  Map.centerObject(aoi, 6);}
  
  //***************************************************************************************************************
  //  Selecting one of the three Forest Masks within the AOI
  //***************************************************************************************************************

  var library10 = require("users/calvites1990/CH-GEE:ForForestMasking");
  var FNF = library10.ForestMasking(aoi2,mask);
 
  //***************************************************************************************************************
  //  Selecting Dependent variables
  //***************************************************************************************************************
  //***************************************************************************************************************
  //  GEDI Relative Height (RH) metrics
  //***************************************************************************************************************
  var dataset = ee.ImageCollection("LARSE/GEDI/GEDI02_A_002_MONTHLY")
  var library2 = require("users/calvites1990/CH-GEE:L2A_GEDI_source"); 
  var gedi = library2.ToGEDI(dataset,gedi_type,startDateGEDI,endDateGEDI,quantile,FNF) 
  //***************************************************************************************************************
  //  Selecting Independent variables
  //***************************************************************************************************************
  //***************************************************************************************************************
  //  Harmonized Sentinel-2 MSI: MultiSpectral Instrument, Level-2A
  //***************************************************************************************************************
  var library3 = require("users/calvites1990/CH-GEE:Sentinel2_source");
  var s2 = library3.calculateCompositeClip(year, start_date, end_date, 70, 20,FNF,aoi2);
  
  //***************************************************************************************************************
  // Global Multi-resolution Terrain Elevation Data 2010
  // Slope from Global Multi-resolution Terrain Elevation Data 2010
  //***************************************************************************************************************
  var dem       = ee.Image("USGS/SRTMGL1_003")//ee.Image("USGS/GMTED2010")//ee.Image('MERIT/DEM/v1_0_3');//
  var Mask      = dem.gt(0);
  var demMasked = dem.mask(Mask).rename('dem');
  var slope     = ee.Terrain.slope(demMasked );
  var aspect    = ee.Terrain.aspect(demMasked );
  //***************************************************************************************************************
  //  Sentinel-1
  //***************************************************************************************************************
  var library6 = require("users/calvites1990/CH-GEE:Sentinel1_source");
  var composite = library6.to_sentinel_filtered(year, start_date,end_date,aoi2,FNF)
  //***************************************************************************************************************
  //  Creating a dataset using dependent and independent variables
  //***************************************************************************************************************
  var merged = s2.select(ee.List.sequence(0,11,1)).addBands(gedi)
  .addBands(demMasked).addBands(slope).addBands(aspect).addBands(composite);
  //***************************************************************************************************************
  //  Application of random sampling in large areas
  //***************************************************************************************************************
  if(scale === 100){
   var cellSize = 4000
  }else{  
   if(polygonArea < 5000){
     cellSize = 100                              
   }else if( polygonArea >= 5000 & polygonArea < 1000000){
     cellSize = 4000;// 4000 // Riducendo questo valore aumenti l'accuratezza
   }else if(polygonArea >= 1000000 & polygonArea < 2000000){ 
     cellSize = 6000 //6000
   }else if(polygonArea >= 2000000 & polygonArea < 3000000){
       cellSize = 6000
       }else{cellSize = 50000;
     }}
    //
   var libraryRS = require("users/calvites1990/CH-GEE:RandomSampling");
   var generatedPoints = libraryRS.generateSamplingSites(aoi2, cellSize, 1, FNF);
   var aoi_buffer = generatedPoints.buffer;
   var aoi_prova = aoi_buffer.geometry();
  //***************************************************************************************************************
  //  Sampling configuration for small and large area (4000 km2 is used as the threshold)
  //***************************************************************************************************************
   if(polygonArea <= 4000){
    var reference = merged.sample({
      region: aoi,
      scale: 10, 
      dropNulls: true,
      numPixels: 1e13, 
      tileScale: 4,
      seed: 0,
      geometries: true});
      }else{ 
        reference = merged.sample({
       region: ee.Geometry(aoi_prova),
       scale: scale, 
       dropNulls: true,
       numPixels: 1e13, 
       tileScale: 16,
       seed: 0,
       geometries: true});
      }
  //***************************************************************************************************************
  //  Splitting the dataset into training and validation sets 
  //***************************************************************************************************************
   reference = reference.randomColumn('random');
   var split = 0.8;
   var training = reference.filter(ee.Filter.lt('random', split));
   var validation = reference.filter(ee.Filter.gte('random', split));

  //***************************************************************************************************************
  // Colnames all of used variables
  //***************************************************************************************************************
   var predictorsNames = s2.select(ee.List.sequence(0,11,1))
  .addBands(demMasked).addBands(slope).addBands(aspect)//.bandNames();
  .addBands(composite).bandNames();
  //***************************************************************************************************************
  // Configurating the hyperparameters in each of the three machine learning algorithms:
  // RF   - Random Forest 
  // CART - Classification And Regression Trees classifier
  // GB   - Gradient Tree Boost 
  //***************************************************************************************************************
  if(model=="RF"){
    var  classifier = ee.Classifier.smileRandomForest({
      numberOfTrees:ee.Number(numTreesRF),
      variablesPerSplit: ee.Number(varSplitRF),
      minLeafPopulation: ee.Number(minLeafPopuRF), 
      bagFraction: ee.Number(bagFracRF), 
      maxNodes: ee.Number(maxNodesRF)
      }).setOutputMode("Regression") // used to predict class / continuous variables etc.
                    .train(training, "rh", predictorsNames); 
                    }
  //***************************************************************************************************************
   if(model=="CART"){
   classifier = ee.Classifier.smileCart({
     maxNodes: maxNodesCART,
     minLeafPopulation: ee.Number(minLeafPopCART)
     }).train(training, "rh", predictorsNames)
                    .setOutputMode("Regression"); // used to predict class / continuous variables etc.
      }
  //***************************************************************************************************************
  if(model=="GBM"){
   classifier = ee.Classifier.smileGradientTreeBoost({
     numberOfTrees: ee.Number(numTreesGBM),
    shrinkage: ee.Number(shrGBM),
    samplingRate: ee.Number(samLingRateGBM),
    maxNodes: ee.Number(maxNodesGBM),
   // loss: ee.String(lossGBM)
    }).train(
    training, "rh", predictorsNames)
    .setOutputMode("Regression"); // used to predict class / continuous variables etc.
   }
  //***************************************************************************************************************
  // Prediction of canopy heights 
  //***************************************************************************************************************
  var classified = merged.classify(classifier);

  //***************************************************************************************************************
  // Scatter Plot 
  //***************************************************************************************************************
  var library4  = require("users/calvites1990/CH-GEE:ForPlots");
  var validated = validation.classify(classifier);
  var RMSE      = library4.CalculationRMSE(validated);
  library4.SCPLOT(validated,RMSE);
  //***************************************************************************************************************
  // Variable Importance Plot
  //***************************************************************************************************************
  library4.VARIMP(classifier);//* variable important function
  //***************************************************************************************************************
  // Canopy height map
  //***************************************************************************************************************
  library4.scalecolor(0,50,classified);
  //
   return([classified])
  };
exports.CanopyHeightMapper = CanopyHeightMapper;

//***************************************************** End *****************************************************
