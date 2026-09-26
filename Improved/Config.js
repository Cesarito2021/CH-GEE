// Supported settings for the independent single-map application.
function number(value,fallback,name,min,max,integer){
 if(value===undefined||value===null||value===''||value==='null')value=fallback;
 var n=Number(value);if(!isFinite(n)||n<min||n>max||(integer&&Math.floor(n)!==n))throw new Error('Invalid '+name);
 return n;
}
function choice(value,fallback,choices,name){
 value=value===undefined?fallback:value;if(choices.indexOf(value)<0)throw new Error('Invalid '+name);return value;
}
function date(value,name){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||isNaN(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('Invalid '+name);return value;
}
exports.normalize=function(input){
 input=input||{};if(!input.aoi)throw new Error('An area of interest is required.');
 var o={aoi:input.aoi};
 o.predictor_model=choice(input.predictor_model,'model2',['model1','model2'],'predictor set');
 var original=o.predictor_model==='model1';
 o.pipeline_version=original?'original':'improved';
 o.dataset_option='S2S1';
 o.dem_source=original?'GMTED2010':'COPERNICUS';
 o.s1_composite=original?'mean':'median';o.s2_composite='median';
 o.selection=original?'none':'mean';o.top_n_vars=0;
 o.maxReferenceHeight=original?null:50;
 o.beams=choice(input.beams,'all',['all','strong','weak'],'GEDI beams');
 o.acquisition=choice(input.acquisition,'all',['all','daytime','nighttime'],'GEDI time acquisition');
 o.year=number(input.year,2019,'year',2017,2100,true);
 o.model=choice(input.model,'RF',['RF','GBM','CART'],'algorithm');
 o.mask=choice(input.mask,'none',['none','FNF','DW'],'forest mask');
 o.maskClasses=o.mask==='none'?[]:(input.maskClasses===undefined?(o.mask==='DW'?[1]:[1,2]):input.maskClasses);
 if(!Array.isArray(o.maskClasses)|| (o.mask!=='none'&&!o.maskClasses.length))throw new Error('Select at least one land-cover category.');
 o.maskClasses=o.maskClasses.map(function(v){return number(v,null,'land-cover category',o.mask==='DW'?0:1,o.mask==='DW'?8:4,true);});
 o.gedi_type=choice(input.gedi_type,'singleGEDI',['singleGEDI','meanGEDI'],'GEDI metric');
 o.quantile=input.quantile||'rh95';if(!/^rh(?:[0-9]|[1-9][0-9]|100)$/.test(o.quantile))throw new Error('Invalid RH metric');
 o.start_date=input.start_date||'04-01';o.end_date=input.end_date||'09-30';
 o.start_date=date(o.start_date.length===5?o.year+'-'+o.start_date:o.start_date,'predictor start');
 o.end_date=date(o.end_date.length===5?o.year+'-'+o.end_date:o.end_date,'predictor end');
 if(o.start_date>=o.end_date)throw new Error('Predictor end must follow start.');
 o.year=Number(o.start_date.slice(0,4));
 o.maskYear=number(input.maskYear,o.year,'land-cover year',2015,2100,true);
 if(o.mask==='FNF'&&(o.maskYear<2017||o.maskYear>2020))throw new Error('FNF4 is available for 2017–2020. Set a land-cover year in that range or use Dynamic World.');
 o.startDateGEDI=date(input.startDateGEDI||o.year+'-01-01','GEDI start');
 o.endDateGEDI=date(input.endDateGEDI||(o.year+1)+'-12-31','GEDI end');
 if(o.startDateGEDI>=o.endDateGEDI)throw new Error('GEDI end must follow start.');
 o.cloudsTh=number(input.cloudsTh,30,'cloud cover',0,100);o.cloudProbability=20;
 o.numTreesRF=number(input.numTreesRF,500,'RF trees',1,10000,true);
 o.numTreesGBM=number(input.numTreesGBM,500,'GBM trees',1,10000,true);
 o.seed=12345;o.trainFraction=0.7;o.split='random';o.blockSize=1000;
 o.sampling='legacy';o.sampleScale=25;o.predictorScale=10;o.buffer=0;o.maxSamples=50000;o.orbit='BOTH';
 var optional={varSplitRF:[1,200,true],minLeafPopuRF:[1,10000,true],bagFracRF:[0.01,1,false],maxNodesRF:[2,100000,true],
  shrGBM:[0.0001,1,false],samLingRateGBM:[0.01,1,false],maxNodesGBM:[2,100000,true],maxNodesCART:[2,100000,true],minLeafPopCART:[1,10000,true]};
 Object.keys(optional).forEach(function(k){var v=input[k];if(v===undefined||v===null||v===''||v==='null')return;var b=optional[k];o[k]=number(v,null,k,b[0],b[1],b[2]);});
 o.lossGBM=choice(input.lossGBM,'LeastAbsoluteDeviation',['LeastSquares','LeastAbsoluteDeviation','Huber'],'GBM loss');
 if(input.areaHa!==undefined)o.areaHa=number(input.areaHa,null,'area',0,1e10,true);
 return o;
};
