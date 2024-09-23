//*****************************************************************************************************************************
//******************************************** CanopyHeightMapper *************************************************************
//*****************************************************************************************************************************

// Draw AOI 
function drawCustomAoi(){
   while (Map.drawingTools().layers().length() > 0) {
    Map.drawingTools().layers().remove(Map.drawingTools().layers().get(0));
   }
   function f() {}
 Map.drawingTools().onDraw(ui.util.debounce(f, 500));
 Map.drawingTools().setShape('polygon');
 Map.drawingTools().setLinked(true);
 Map.drawingTools().draw();
}

// load inputs
function loadInputs(){
  
var u_chooseAoi                  = chooseAoiCheckSelector          .getValue();
var u_aoiShp                     = aoiShpTexbox                    .getValue();  
var u_numTreesRF                 = numTreesRF                      .getValue();  
var u_varSplitRF                 = varSplitRF                      .getValue();  
var u_minLeafPopuRF              = minLeafPopuRF                   .getValue();  
var u_bagFracRF                  = bagFracRF                       .getValue();  
var u_maxNodesRF                 = maxNodesRF                      .getValue();  
var u_numTreesGBM                = numTreesGBM                     .getValue();  
var u_shrGBM                     = shrGBM                          .getValue();  
var u_samLingRateGBM             = samLingRateGBM                  .getValue();  
var u_maxNodesGBM                = maxNodesGBM                     .getValue();  
var u_lossGBM                    = lossGBM                         .getValue();  
var u_maxNodesCART               = maxNodesCART                    .getValue();  
var u_minLeafPopCART             = minLeafPopCART                  .getValue();  
var u_choose_mask1               = selectmask1                     .getValue();  
var u_choose_mask2               = selectmask2                     .getValue();  
var u_choose_mask3               = selectmask3                     .getValue();  
var u_year                       = YearTexbox                      .getValue();
var u_start_date                 = startDateTexbox                 .getValue();
var u_end_date                   = endDateTexbox                   .getValue();
var u_startDateGEDI              = startDateGEDITexbox             .getValue();
var u_endDateGEDI                = endDateGEDITexbox               .getValue();
var u_TypePerc1                  = TypePercCheckbox1               .getValue();
var u_quantile                   = quantileSlider                  .getValue();
var u_TypePerc2                  = TypePercCheckbox2               .getValue();
var u_choose_modelTexbox1        = choose_modelTexbox1             .getValue();
var u_choose_modelTexbox2        = choose_modelTexbox2             .getValue();
var u_choose_modelTexbox3        = choose_modelTexbox3             .getValue();
var u_outputImgName              = u_outputImgNameTexbox           .getValue();
var u_DownloadOutput             = u_DownloadOutputCheckbox        .getValue();
var u_outputFolder               = u_outputFolderTexbox            .getValue();

// adjust inputs
var u_aoi;
if (u_chooseAoi == 'Draw'){
  u_aoi = Map.drawingTools().layers().get(0).getEeObject();
}else if (u_chooseAoi == 'Boundary'){
  u_aoi = ee.FeatureCollection(u_aoiShp);}

u_year                  =  Number(u_year                  );
u_start_date            =  String(u_start_date            );
u_end_date              =  String(u_end_date              );
u_startDateGEDI         =  String(u_startDateGEDI         );
u_endDateGEDI           =  String(u_endDateGEDI           );
u_numTreesRF            =  Number(u_numTreesRF            ); 
u_varSplitRF            =  Number(u_varSplitRF            ); 
u_minLeafPopuRF         =  Number(u_minLeafPopuRF         ); 
u_bagFracRF             =  Number(u_bagFracRF             ); 
u_maxNodesRF            =  Number(u_maxNodesRF            ); 
u_numTreesGBM           =  Number(u_numTreesGBM           ); 
u_shrGBM                =  Number(u_shrGBM                ); 
u_samLingRateGBM        =  Number(u_samLingRateGBM        ); 
u_maxNodesGBM           =  Number(u_maxNodesGBM           ); 
u_lossGBM               =  Number(u_lossGBM               ); 
u_maxNodesCART          =  Number(u_maxNodesCART          ); 
u_minLeafPopCART        =  Number(u_minLeafPopCART        ); 
u_quantile              =  "rh"+u_quantile                ;
u_outputImgName         =  String(u_outputImgName         ); 
u_outputFolder          =  String(u_outputFolder          ); 


  return { 
          u_chooseAoi                : u_chooseAoi,        
          u_aoi                      : u_aoi,              
          u_numTreesRF               : u_numTreesRF,       
          u_varSplitRF               : u_varSplitRF,       
          u_minLeafPopuRF            : u_minLeafPopuRF,    
          u_bagFracRF                : u_bagFracRF,        
          u_maxNodesRF               : u_maxNodesRF,       
          u_numTreesGBM              : u_numTreesGBM,      
          u_shrGBM                   : u_shrGBM,           
          u_samLingRateGBM           : u_samLingRateGBM,  
          u_maxNodesGBM              : u_maxNodesGBM,      
          u_lossGBM                  : u_lossGBM,          
          u_maxNodesCART             : u_maxNodesCART,     
          u_minLeafPopCART           : u_minLeafPopCART,  
          u_choose_mask1             : u_choose_mask1,    
          u_choose_mask2             : u_choose_mask2,    
          u_choose_mask3             : u_choose_mask3,    
          u_TypePerc1                : u_TypePerc1,       
          u_TypePerc2                : u_TypePerc2,       
          u_choose_modelTexbox1      : u_choose_modelTexbox1,       
          u_choose_modelTexbox2      : u_choose_modelTexbox2,
          u_choose_modelTexbox3      : u_choose_modelTexbox3,
          u_year                     : u_year,
          u_start_date               : u_start_date,
          u_end_date                 : u_end_date,
          u_startDateGEDI            : u_startDateGEDI,
          u_endDateGEDI              : u_endDateGEDI,
          u_quantile                 : u_quantile,
          u_outputImgName            : u_outputImgName,
          u_DownloadOutput           : u_DownloadOutput, 
          u_outputFolder             : u_outputFolder,
          };
}

// InputShapefile = function(shapefile)
// Run the model
function mapheigts(){
    var Inputs = loadInputs();
    var library = require("users/calvites1990/CH-GEE:CH-GEE_main");
    var library5 = require("users/calvites1990/CH-GEE:ForUploadDownload");  
if(Inputs.u_chooseAoi == "Draw"){
   // *******************************************************  [RANDOMFORESTS] ************************************************************************************************
   // *******************************************************  [RANDOMFORESTS] ************************************************************************************************
   // *******************************************************  [RANDOMFORESTS] ************************************************************************************************
   if(Inputs.u_choose_modelTexbox1){
   if(Inputs.u_TypePerc1){
     if(Inputs.u_choose_mask1){
       if(Inputs.u_PeriodGEDI){
       var tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  
       Inputs.u_quantile,'RF','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF,
       Inputs.u_maxNodesRF,Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,
       Inputs.u_minLeafPopCART);
       }else{
         tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, 
       Inputs.u_quantile,'RF','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF,
       Inputs.u_maxNodesRF,Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,
       Inputs.u_minLeafPopCART);
         
       }
     }
     else if(Inputs.u_choose_mask2){
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, 
     'RF','FNF','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else{ // 100pxult
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  'rh100', 
     'RF','none','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
      }
   }
   // 
  else{// if(Inputs.u_TypePerc2){
    if(Inputs.u_choose_mask1){
     tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, 
     'RF','DW','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, 
     'RF','FNF','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else{ // default
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'RF','none','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);  
      }
   }}
   // *******************************************************  [     GBM     ] ************************************************************************************************
   // *******************************************************  [     GBM     ] ************************************************************************************************
   // *******************************************************  [     GBM     ] ************************************************************************************************
    else if(Inputs.u_choose_modelTexbox2){
        if(Inputs.u_TypePerc1){
     if(Inputs.u_choose_mask1){
     tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'GBM','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile,  
     'GBM','FNF','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else{ // default
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  'rh100', 
     'GBM','none','singleGEDI',Inputs.u_numCanopyHeightMappersRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
      }
   }
   // 
  else{// if(Inputs.u_TypePerc2){
    if(Inputs.u_choose_mask1){
     tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_quantile, 
     'GBM','DW','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile,
     'GBM','FNF','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else{ // default
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'GBM','none','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);  
      }
   }
   }
   // ******************************************************** [     CART    ] ************************************************************************************************
   // ******************************************************** [     CART    ] ************************************************************************************************
   // ******************************************************** [     CART    ] ************************************************************************************************ 
   else{// if(Inputs.choose_modelTexbox3){
     if(Inputs.u_TypePerc1){
     if(Inputs.u_choose_mask1){
     tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'CART','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'CART','FNF','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else{ // default
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   'rh100', 
     'CART','none','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
      }
   }
   // 
  else{// if(Inputs.u_TypePerc2){
    if(Inputs.u_choose_mask1){
     tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile,
     'CART','DW','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, 
     'CART','FNF','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else{ // default
          tree_heights = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'CART','none','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);  
      }
   }
   }
   // ************************************************************************************************
   //Map.centerObject(Inputs.u_aoi, 8);
  if(Inputs.u_DownloadOutput){
      library5.DownloadImg(tree_heights,Inputs.u_outputImgName,Inputs.u_outputFolder,Inputs.u_aoi);}//
      //
      }
      else if(Inputs.u_chooseAoi == 'Boundary'){
   // *******************************************************  [RANDOMFORESTS] ************************************************************************************************
   // *******************************************************  [RANDOMFORESTS] ************************************************************************************************
   // *******************************************************  [RANDOMFORESTS] ************************************************************************************************
   if(Inputs.u_choose_modelTexbox1){
   if(Inputs.u_TypePerc1){
     if(Inputs.u_choose_mask1){
       var tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  
       Inputs.u_quantile,'RF','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF,
       Inputs.u_maxNodesRF,Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,
       Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile,  
     'RF','FNF','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask3){//else{ // 100pxult
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, 
     'RF','none','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
      }
   }
   // 
  else{// if(Inputs.u_TypePerc2){
    if(Inputs.u_choose_mask1){
     tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'RF','DW','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date,Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, // Inputs.u_scale, 
     'RF','FNF','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask3){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'RF','none','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);  
      }
   }}
   // *******************************************************  [     GBM     ] ************************************************************************************************
   // *******************************************************  [     GBM     ] ************************************************************************************************
   // *******************************************************  [     GBM     ] ************************************************************************************************
    else if(Inputs.u_choose_modelTexbox2){
        if(Inputs.u_TypePerc1){
     if(Inputs.u_choose_mask1){
     tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'GBM','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'GBM','FNF','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask3){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'GBM','none','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
      }
   }
   // 
  else{// if(Inputs.u_TypePerc2){
    if(Inputs.u_choose_mask1){
     tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI, Inputs.u_quantile, 
     'GBM','DW','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'GBM','FNF','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask3){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date, Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'GBM','none','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);  
      }
   }
   }
   // ******************************************************** [     CART    ] ************************************************************************************************
   // ******************************************************** [     CART    ] ************************************************************************************************
   // ******************************************************** [     CART    ] ************************************************************************************************ 
   else{// if(Inputs.u_choose_modelTexbox3){
     if(Inputs.u_TypePerc1){
     if(Inputs.u_choose_mask1){
     tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,  Inputs.u_quantile, 
     'CART','DW','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,  Inputs.u_quantile, 
     'CART','FNF','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask3){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'CART','none','singleGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
      }
   }
   // 
  else{
    if(Inputs.u_choose_mask1){
     tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,  Inputs.u_quantile, 
     'CART','DW','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
     else if(Inputs.u_choose_mask2){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile,  
     'CART','FNF','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);
     }
    else if(Inputs.u_choose_mask3){
          tree_heights_CC = library.CanopyHeightMapper(Inputs.u_aoi, Inputs.u_year, Inputs.u_start_date, 
     Inputs.u_end_date,Inputs.u_startDateGEDI,Inputs.u_endDateGEDI,   Inputs.u_quantile, 
     'CART','none','meanGEDI',Inputs.u_numTreesRF,Inputs.u_varSplitRF,Inputs.u_minLeafPopuRF,Inputs.u_bagFracRF, Inputs.u_maxNodesRF,
     Inputs.u_numTreesGBM,Inputs.u_shrGBM,Inputs.u_samLingRateGBM,Inputs.u_maxNodesGBM,Inputs.u_lossGBM,Inputs.u_maxNodesCART,Inputs.u_minLeafPopCART);  
      }
   }
   }
   //**************************************************************************************************************************************************************************
      if(Inputs.u_DownloadOutput){
      library5.DownloadImg(tree_heights_CC,Inputs.u_outputImgName,Inputs.u_outputFolder,Inputs.u_aoi
      )}
      }    
    }
function removeLayers(){
  Map.clear();
  var widgets = ui.root.widgets();
  if (widgets.length()>3){
  ui.root.remove(ui.root.widgets().get(3));
  }
}
//  ********************************* Drawn study area  **********************************
function drawNewStdyArea(){
  if(Map.drawingTools().layers().length() > 0){
    drawCustomAoi()
    }
  }
//  *********************************  Title  **********************************
var Title = ui.Label({value: "Canopy Height Mapper - GEE web app", style:{
backgroundColor : "#424457", color: "#7ED63C", fontSize: "28px", fontFamily: "monospace"}});
//  ********************************* Subtitle  **********************************
var Subtitle = ui.Label({value: "INPUT/OUTPUT OPTIONS", style:{
backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var spatialExtenttitle = ui.Label({value: "Spatial extent settings", style:{
backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var datasettingtitle = ui.Label({value: "Data settings", style:{
backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var modelsettingtitle = ui.Label({value: "Model parameter settings", style:{
backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});

var downloadsettingtitle = ui.Label({value: "Download settings", style:{
backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color:"#FFFF33"}});


//  ***************************** Text for AOI polygon ******************************  
var aoiShpTexbox = ui.Textbox({
  placeholder: 'Area Of Interest (shp)',
  value: 'users/calvites1990/PENNATARO',
  style: {shown: false, width: '335px',color: '#333333',border: '1px solid darkgray'}
});
//  *********************************   AOI upload   *********************************  
var chooseAoiCheckSelector = ui.Select({
 items: [
   {label: 'Draw Area Of Interest (AOI) - Geometry tools'  , value: "Draw"    },
   {label: 'Upload Area Of Interest (AOI) - Shapefile format '    , value: "Boundary"}],
style: {color: '#333333',border: '2px solid darkgray',width: '335px',height: '30px',fontWeight: 'bold', fontSize: '20px'}
   }).setValue("Draw");
//  *********************************   Canopy heights map    ***************************
var u_DownloadOutputCheckbox = ui.Checkbox({
  label:'Download Canopy Heights Map', value:false, style:{shown: true,
  backgroundColor : "#424457", fontFamily: "monospace", fontWeight: 'bold', fontSize: '18px',color: "#43A5BE" }});
//  *********************************   Forest Masks    *******************************
var u_MaskCheckbox = ui.Checkbox({
  label:'Toggle Forest Mask', 
  value:false, style:{shown: true,backgroundColor : "#424457", color:"#43A5BE", fontSize: "18px", fontFamily: "monospace"}});
 //
  chooseAoiCheckSelector.onChange(function(aoiOption){   
                         if(aoiOption == "Draw"){
                           aoiTexbox.style().set('shown', true);
                           aoiTexbox.setValue('Draw');
                           u_DownloadOutputCheckbox.style().set('shown', true); 
                           u_DownloadOutputCheckbox.style().set('shown', true); 
                           u_DownloadOutputCheckbox.setValue(false); 
                           runDrawNewStdyArea.style().set('shown', true);
                           Map.drawingTools().setShape(null);
                           drawCustomAoi();
                         }
                        if(aoiOption == "Boundary"){
                           aoiShpTexbox.style().set('shown', true);
                           aoiShpTexbox.setValue('users/calvites1990/PENNATARO');
                           u_MaskCheckbox.style().set('shown', true); //*
                           u_MaskCheckbox.setValue(false); 
                           u_DownloadOutputCheckbox.style().set('shown', true); //*
                           u_DownloadOutputCheckbox.setValue(false); 
                           runDrawNewStdyArea.style().set('shown', true);
                           Map.drawingTools().setShape(null);
                           }
                           })
//  *********************************   Year for Collecting images    *******************************
var YearTexbox = ui.Select({
  items: [
                  {label: '2017',    value: "2017"},
                  {label: '2018',    value: "2018"},
                  {label: '2019',    value: "2019"},
                  {label: '2020',    value: "2020"},
                  {label: '2021',    value: "2021"},
                  {label: '2022',    value: "2022"},
                  {label: '2023',    value: "2023"}
                  ],
                  style: {color: '#333333',width: '100px',height: '30px', border: '2px solid darkgray'}
                  }).setValue("2019");
//  *********************************   Start date for Collecting images    *******************************
var startDateTexbox = ui.Textbox({
placeholder: 'startDate (e.g. 07-01)',
value: '07-01',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//  *********************************   Ends date for Collecting images    *******************************
var endDateTexbox = ui.Textbox({
placeholder: 'endDate (e.g. 08-31)',
value: '08-31',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//*********************************************************************************************************
//************************************  Data for collecting GEDI footprints *******************************
//*********************************************************************************************************
//  *********************************   Start date for Collecting images    *******************************
var startDateGEDITexbox = ui.Textbox({
placeholder: 'startDate (e.g. 2019-01-01)',
value: '2019-01-01',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//  *********************************   Ends date for Collecting images    ********************************
var endDateGEDITexbox = ui.Textbox({
placeholder: 'endDate (e.g. 2019-12-31)',
value: '2019-12-31',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//  *********************************   GEDI footprints collection    *************************************
var Label_GEDI    =  ui.Label({value: "Temporal extent setting for GEDI footprints collection", 
                            style:{backgroundColor : "#424457", shown: true, fontFamily: "monospace", 
                              fontWeight: 'bold', fontSize: '18px',color: "white"   }});
//*********************************************************************************************************
//************************************  Hyperparameters for ML algorithms  ********************************
//*********************************************************************************************************
var Label_numTreesRF    =  ui.Label({value: "numberOfTrees", 
style:{width: '100px', backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var numTreesRF  = ui.Textbox({ placeholder: 'numberOfTrees',value: '500',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_varSplitRF    =  ui.Label({value: "variablesPerSplit", 
style:{width: '100px', backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var varSplitRF  = ui.Textbox({ placeholder: 'varSplitRF',value: 'null',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_minLeafPopuRF    =  ui.Label({value: "minLeafPopulation", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var minLeafPopuRF  = ui.Textbox({ placeholder: 'minLeafPopulation',value: '1',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_bagFracRF    =  ui.Label({value: "bagFraction", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var bagFracRF  = ui.Textbox({ placeholder: 'bagFraction',value: '0.5',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_maxNodesRF    =  ui.Label({value: "maxNodes", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var maxNodesRF  = ui.Textbox({ placeholder: 'maxNodes',value: 'null',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//*********************************** GBM  *********************************************
var Label_numTreesGBM    =  ui.Label({value: "numberOfTrees", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var numTreesGBM  = ui.Textbox({ placeholder: 'numberOfTrees',value: '500',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_shrGBM    =  ui.Label({value: "shrinkage", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var shrGBM  = ui.Textbox({ placeholder: 'shrinkage',value: '0.05',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_samLingRateGBM    =  ui.Label({value: "samplingRate", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var samLingRateGBM  = ui.Textbox({ placeholder: 'samplingRate',value: '0.7',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_maxNodesGBM   =  ui.Label({value: "maxNodes", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var maxNodesGBM  = ui.Textbox({ placeholder: 'maxNodes',value: 'LeastAbsoluteDeviation',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_lossGBM    =  ui.Label({value: "loss", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var lossGBM  = ui.Textbox({ placeholder: 'loss',value: 'null',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//*********************************** CART *********************************************
var Label_maxNodesCART    =  ui.Label({value: "maxNodes", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var maxNodesCART  = ui.Textbox({ placeholder: 'maxNodes',value: 'null',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//
var Label_minLeafPopCART    =  ui.Label({value: "minLeafPopulation", 
style:{backgroundColor : "#424457", color: "white", shown: true, fontFamily: "monospace"}});
var minLeafPopCART  = ui.Textbox({ placeholder: 'minLeafPopulation',value: '1',
style: {width: '100px',height: '30px',color: '#333333',border: '2px solid darkgray'}});
//********************************************************************************************************
//***********************************  Download maps      ************************************************
//********************************************************************************************************
var u_outputFolderTexbox = ui.Textbox({                                
  placeholder: 'Output img folder name  (e.g. out)',                              
  value: 'ee_drive',
  style: {width: '155px', shown: false}});
var u_outputImgNameTexbox = ui.Textbox({
  placeholder: 'Output img name  (e.g. out)',
  value: 'CH-GEE map',
  style: {width: '155px', shown: false}});

 //  *********************************     Folder label maps      ****************************************
 var outputFolderLabel = ui.Label({value: "Google Drive folder name", style:{
   shown: false, backgroundColor : "#424457", color: "white"}});
 var outputImgNameLabel = ui.Label({value: "Canopy height map name", style:{
  shown: false,backgroundColor : "#424457", color: "white"}});
 //  *********************************     Download maps      ********************************************
 u_DownloadOutputCheckbox.onChange(function(checked){  
   if(checked){
     u_outputImgNameTexbox.style().set('shown', true);
     outputImgNameLabel.style().set('shown', true);
     //
     u_outputFolderTexbox.style().set('shown', true);
     outputFolderLabel.style().set('shown', true);
   }else{
     u_outputImgNameTexbox.style().set('shown', false);
     outputImgNameLabel.style().set('shown', false);
     //
     u_outputFolderTexbox.style().set('shown', false);                    
    outputFolderLabel.style().set('shown', false);                       
   }
 });
 //  *****************************     Define aesthetics      ********************************************
var quantileSlider          =  ui.Slider({min: 0, max: 100, value:95, step: 1,
                               style: { width: '165px', backgroundColor : "#424457", color: "white",shown: false}});
var quantileLabel           =  ui.Label({value: "Relative height (Rh) percentile (m)", 
                              style:{backgroundColor : "#424457", color: "white", shown: false, fontFamily: "monospace"}});
//*********************************************************************************************************
//************************************   Check boxes onChange Forest Mask  ********************************
//*********************************************************************************************************

var selectmask1 = ui.Checkbox({label: 'Forest mask derived from Dynamic World product (ver. 2)', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
var selectmask2 = ui.Checkbox({label: 'Forest mask derived from Global 4-class PALSAR-2 map', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
  var selectmask3 = ui.Checkbox({label: 'Exclude Forest Mask', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
//*********************************************************************************************************
//************************************   Check boxes onChange Forest Mask  ********************************
//*********************************************************************************************************
var GeneralMaskCheckbox = ui.Checkbox({label: 'Toggle Forest Mask (Forest/Non-Forest)', value: false, style:{shown: true,
  backgroundColor : "#424457",fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
  //
GeneralMaskCheckbox.onChange(function(checked){   
                         if(checked){
                           secondpanel1.style().set('shown', true); 
                         }
                         else {
                           secondpanel1.style().set('shown', false);
                         }
                       });
                       // Advanced options panel
 var secondpanel1 = ui.Panel({style: {width: '100%', backgroundColor: "#424457",
 textAlign: "center", whiteSpace: "nowrap",shown: false }});

//*********************************************************************************************************
//************************************   Check boxes onChange GEDI metrics ********************************
//*********************************************************************************************************
var TypePercCheckbox1 = ui.Checkbox({label: 'Single GEDI Rh metric', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
  //
TypePercCheckbox1.onChange(function(checked){   
                         if(checked){
                           quantileSlider.style().set('shown', true);
                           quantileSlider.setValue(95);
                           quantileLabel.style().set('shown', true);
                           }else{
                           quantileSlider.style().set('shown', false);
                           quantileSlider.setValue(95);
                           quantileLabel.style().set('shown', false);
                         }
                       });
var TypePercCheckbox2 = ui.Checkbox({label: 'Average GEDI Rh metric among Rh75,Rh90,Rh95 and Rh100',value: false, style:{shown: true,
backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});

///*********************************************************************************************************
//******************************** Check boxes onChange ML algorithms  *************************************
///*********************************************************************************************************
var GeneralModelCheckbox = ui.Checkbox({label: 'Select and set Machine Learning (ML) algorithm', value: false, 
style:{shown: true, backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
  //
GeneralModelCheckbox.onChange(function(checked){   
                         if(checked){
                           secondpanel3.style().set('shown', true); 
                         }
                         else {
                           secondpanel3.style().set('shown', false);
                            }
                       });
                       // Advanced options panel
 var secondpanel3 = ui.Panel({style: {width: '100%', backgroundColor: "#424457",
 textAlign: "center", whiteSpace: "nowrap",shown: false }});
// *********************************************************************************************************
var choose_modelTexbox1 = ui.Checkbox({label: 'Random Forests (RF)', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
  //
// Download maps
 choose_modelTexbox1.onChange(function(checked){   
                         if(checked){
                           secondpanel4.style().set('shown', true); 
                         }
                         else {
                           secondpanel4.style().set('shown', false);
                         }
                       });
 var secondpanel4 = ui.Panel({style: {width: '100%', backgroundColor: "#424457",
 textAlign: "center", whiteSpace: "nowrap",shown: false }});4
// *********************************************************************************************************
 var choose_modelTexbox2 = ui.Checkbox({label: 'Gradient Tree Boost (GB)', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
  //
// Download maps
 choose_modelTexbox2.onChange(function(checked){   
                         if(checked){
                           secondpanel5.style().set('shown', true); 
                         }
                         else {
                           secondpanel5.style().set('shown', false);
                         }
                       });
   //
 var secondpanel5 = ui.Panel({style: {width: '100%', backgroundColor: "#424457",
 textAlign: "center", whiteSpace: "nowrap",shown: false }});
 
 // ******************************************************************************************************
var choose_modelTexbox3 = ui.Checkbox({label: 'Classification and Regression Trees (CART)', value: false, style:{shown: true,
  backgroundColor : "#424457", color: "white", fontSize: "16px", fontFamily: "monospace"}});
  //
// Download maps
 choose_modelTexbox3.onChange(function(checked){   
                         if(checked){
                           secondpanel6.style().set('shown', true); 
                         }
                         else {
                           secondpanel6.style().set('shown', false);
                         }
                       });
   //
 var secondpanel6 = ui.Panel({style: {width: '100%', backgroundColor: "#424457",
 textAlign: "center", whiteSpace: "nowrap",shown: false }});  
// ********************************************************************************************************
var Label_RemoteSensing    =  ui.Label({value: "Temporal extent setting for Sentinel-1 and 2 collections", 
                            style:{backgroundColor : "#424457", shown: true, fontFamily: "monospace", 
                              fontWeight: 'bold', fontSize: '18px',color: "white"   }});

///*********************************************************************************************************
//********************************   GEDI metrics setting    ***********************************************
///*********************************************************************************************************
var GeneralTypePercCheckbox = ui.Checkbox({label: 'Select GEDI relative height (Rh) metric', value: false, style:{shown: true,
  backgroundColor : "#424457", fontFamily: "monospace",fontWeight: 'bold', fontSize: '18px',color: "#43A5BE"}});
//  
GeneralTypePercCheckbox.onChange(function(checked){   
                         if(checked){
                           secondpanel2.style().set('shown', true); 
                         }
                         else {
                           secondpanel2.style().set('shown', false);
                         }
                       });
                       
// Advanced options panel
 var secondpanel2 = ui.Panel({style: {width: '100%', backgroundColor: "#424457",
 textAlign: "center", whiteSpace: "nowrap",shown: false }});
///*********************************************************************************************************
//*************************************   Global panel   ***************************************************
///*********************************************************************************************************
var panel = ui.Panel({style: {width: '35%', backgroundColor: "#424457", 
border: '1px solid black', textAlign: "center", whiteSpace: "nowrap", shown: true}});

///*********************************************************************************************************
//*************************************   Horizontal panels ************************************************
///*********************************************************************************************************
var AAHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var BBHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var CCHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var DDHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var EEHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var FFHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var GGHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var HHHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var IIHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var JJHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var KKHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
var ZZHorizontalPanel = ui.Panel({layout: ui.Panel.Layout.flow('horizontal'),style: {width: '100%', backgroundColor: "#424457", 
border: 'none' , textAlign: "center", whiteSpace: "nowrap", shown: true}});
///*********************************************************************************************************
//********************************************   Run boxes  ************************************************
///*********************************************************************************************************
var runTreeHeights = ui.Button({
      label: 'Run',style: {color: '#333333',border: '1px solid darkgray'}});
      runTreeHeights.onClick(mapheigts);
var removeLayersButton = ui.Button({
      label: 'Reset',style: {color: '#D62F2B',border: '1px solid darkgray'}});
removeLayersButton.onClick(removeLayers);
var runDrawNewStdyArea = ui.Button({
      label: 'Reset study area',
       onClick: drawNewStdyArea,
      style: {shown: false,color: '#D62F2B',border: '1px solid darkgray'}
 }); 
///*********************************************************************************************************
//********************************************   Link to github  *******************************************
///*********************************************************************************************************
var documentationLabel = ui.Label({value: "Link to Github CH-GEE web app", style:{
  backgroundColor : "#424457", fontSize: "18px", color: "white", shown: true, fontFamily: "monospace"},
  targetUrl: "https://github.com/Cesarito2021/CH-GEE.git"});

///*********************************************************************************************************
//********************************************   Final boxes  **********************************************
///*********************************************************************************************************
// ********  MAIN INFORMATION *********
panel.add(Title);
panel.add(documentationLabel);
panel.add(Subtitle);
panel.add(spatialExtenttitle);
panel.add(chooseAoiCheckSelector);
panel.add(aoiShpTexbox);
panel.add(runDrawNewStdyArea); 
// ********  CHOOSE FOREST MASK *********
secondpanel1.add(selectmask2);
secondpanel1.add(selectmask1);
secondpanel1.add(selectmask3);
panel.add(GeneralMaskCheckbox);
panel.add(secondpanel1);
// ********  DATA SETTING *********
panel.add(datasettingtitle);
// ********  GEDI METRICS *********
secondpanel2.add(TypePercCheckbox1);
secondpanel2.add(quantileLabel);
secondpanel2.add(quantileSlider);
secondpanel2.add(TypePercCheckbox2);
panel.add(GeneralTypePercCheckbox);
panel.add(secondpanel2);
// ********  SET GEDI COLLECTION *********
panel.add(Label_GEDI);
panel.add(ZZHorizontalPanel);
ZZHorizontalPanel.add(startDateGEDITexbox);
ZZHorizontalPanel.add(endDateGEDITexbox);
//********* SET PARAMS FOR PREDICTORS *****
panel.add(Label_RemoteSensing);
panel.add(KKHorizontalPanel);
KKHorizontalPanel.add(YearTexbox);
KKHorizontalPanel.add(startDateTexbox);
KKHorizontalPanel.add(endDateTexbox);
//********* Model settings *************
panel.add(modelsettingtitle);
// ********  SET RANDOM FORESTS *********
secondpanel3.add(choose_modelTexbox1) 
secondpanel4.add(AAHorizontalPanel) 
  AAHorizontalPanel.add(Label_numTreesRF)
  AAHorizontalPanel.add(Label_varSplitRF)
  AAHorizontalPanel.add(Label_minLeafPopuRF)
secondpanel4.add(BBHorizontalPanel)
  BBHorizontalPanel.add(numTreesRF)
  BBHorizontalPanel.add(varSplitRF)
  BBHorizontalPanel.add(minLeafPopuRF)
secondpanel4.add(CCHorizontalPanel)
  CCHorizontalPanel.add(Label_bagFracRF)
  CCHorizontalPanel.add(Label_maxNodesRF)
secondpanel4.add(DDHorizontalPanel)
  DDHorizontalPanel.add(bagFracRF)
  DDHorizontalPanel.add(maxNodesRF)
secondpanel3.add(secondpanel4) 
// ********  SET RANDOM GRADIENT TREE BOOST *********
secondpanel3.add(choose_modelTexbox2)
secondpanel5.add(EEHorizontalPanel) 
 EEHorizontalPanel.add(Label_numTreesGBM)
 EEHorizontalPanel.add(Label_shrGBM)
 EEHorizontalPanel.add(Label_samLingRateGBM)
secondpanel5.add(FFHorizontalPanel)
 FFHorizontalPanel.add(numTreesGBM)
 FFHorizontalPanel.add(shrGBM)
 FFHorizontalPanel.add(samLingRateGBM)
secondpanel5.add(GGHorizontalPanel)
 GGHorizontalPanel.add(Label_maxNodesGBM)
 GGHorizontalPanel.add(Label_lossGBM)
secondpanel5.add(HHHorizontalPanel)
 HHHorizontalPanel.add(maxNodesGBM)
 HHHorizontalPanel.add(lossGBM)
secondpanel3.add(secondpanel5) 
// ********  SET CLASSIFICATION AND REGRESSION TREES  *********
secondpanel3.add(choose_modelTexbox3) 
secondpanel6.add(IIHorizontalPanel) 
 IIHorizontalPanel.add(Label_maxNodesCART)  
 IIHorizontalPanel.add(Label_minLeafPopCART)
secondpanel6.add(JJHorizontalPanel)
 JJHorizontalPanel.add(maxNodesCART)
 JJHorizontalPanel.add(minLeafPopCART)
secondpanel3.add(secondpanel6) 
// ********  CHOOSE MACHINE LEARNING *********
panel.add(GeneralModelCheckbox);
panel.add(secondpanel3)
// ***************  PANEL ********************
panel.add(downloadsettingtitle);
panel.add(u_DownloadOutputCheckbox);
panel.add(outputFolderLabel);
panel.add(u_outputFolderTexbox);
panel.add(outputImgNameLabel);
panel.add(u_outputImgNameTexbox);
panel.add(runTreeHeights);
panel.add(removeLayersButton);
{
ui.root.add(panel);
}
///*********************************************************************************************************
//********************************************   End  ******************************************************
///*********************************************************************************************************


