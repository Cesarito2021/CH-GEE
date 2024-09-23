//************************************************************************************************************
//********************************************** Forest Masking  *********************************************
//************************************************************************************************************

var ForestMasking = function(for_aoi, mask){
if(mask=='FNF'){
var BFNF = ee.ImageCollection("JAXA/ALOS/PALSAR/YEARLY/FNF4")
        .filterBounds(for_aoi)
        .filterDate('2017-01-01', '2020-12-31')
        .first()
        .select('fnf');

var FNF = ee.Image(0)
.updateMask(BFNF)
.where(BFNF.eq(1), 1)
.where(BFNF.eq(2), 1)
return(FNF)
}else if(mask=='DW'){
 var DW = ee.ImageCollection("GOOGLE/DYNAMICWORLD/V1")
                                  .filterBounds(for_aoi)
                                  .filterDate('2022-06-01', '2022-10-30')
                                  .first()
 FNF = DW.select('label').eq(1)
 return(FNF)
}else{
  FNF = ee.Image(1).clip(for_aoi);
  return(FNF)
}
}
exports.ForestMasking  = ForestMasking;

//*************************************************** End ****************************************************
