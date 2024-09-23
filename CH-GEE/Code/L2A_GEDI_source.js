 //***********************************************************************************************
 //************************************** GEDI-L2A data ******************************************
 //***********************************************************************************************

 var ToGEDI = function(data,gedi_type,startDateGEDI,endDateGEDI,quantile,mask_raster){
     var qualityMask = function(img){
     return img.updateMask(img.select("quality_flag").eq(1))
     .updateMask(img.select("degrade_flag").eq(0))
     .updateMask(mask_raster.eq(1))};
  if(gedi_type == 'singleGEDI'){
     var gedi1 = data.map(qualityMask)
      .select(quantile) 
      .filterDate(startDateGEDI,endDateGEDI)
      .reduce(ee.Reducer.firstNonNull()).rename("rh")
    return(gedi1)   
  }if(gedi_type == 'meanGEDI'){ 
     var gedi2 = data.map(qualityMask)
              .select('rh75','rh90','rh95','rh100') 
              .filterDate(startDateGEDI,endDateGEDI)
              .reduce(ee.Reducer.firstNonNull()) 
  var gedim2 = ee.Image(gedi2).reduce(ee.Reducer.mean()).rename('rh')
  return(gedim2)
  }
  }
 exports.ToGEDI  = ToGEDI;
 //************************************** End ****************************************************
