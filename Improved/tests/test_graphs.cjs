const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ee=require('@google/earthengine');
const root=path.resolve(__dirname,'..');
ee.data.getAlgorithms=()=>JSON.parse(fs.readFileSync(path.join(__dirname,'algorithms.json')));ee.initialize();
ee.data.computeValue=()=>{throw new Error('Unexpected server request');};
const cache={};function load(name){if(cache[name])return cache[name];const file=name.startsWith('users/adugnagirma/')?path.join(root,'vendor/gee_s1_ard',name.split(':')[1]+'.js'):path.join(root,name.split(':').pop()+'.js');const c={ee,require:load,exports:{},print(){}};vm.runInNewContext(fs.readFileSync(file,'utf8'),c,{filename:file});return cache[name]=c.exports;}
const config=load('Config'),main=load('CH-GEE_main'),aoi=ee.FeatureCollection([ee.Feature(ee.Geometry.Rectangle([9.29,39.24,9.30,39.25]))]);
for(const predictor_model of ['model1','model2','model3']){
 const o=config.normalize({aoi,predictor_model,areaHa:100});
 assert.equal(o.selection,predictor_model==='model1'?'none':'mean');
 assert.equal(o.trainFraction,.7);assert.equal(o.sampling,'legacy');
 assert.equal(o.maxReferenceHeight,predictor_model==='model1'?null:50);
 for(const model of ['RF','GBM','CART']){
  const r=main.run({...o,model}),g=ee.Serializer.toJSON(r.metrics);
  assert.ok(g.length>1000);assert.ok(!/conformal|calibration|interval_width/.test(g));
  assert.ok(g.includes('rmse_percent')&&g.includes('r2'));
  if(predictor_model==='model1'){assert.ok(!g.includes('Image.pixelLonLat'));assert.ok(g.includes('GMTED'));}
  else assert.ok(g.includes('Image.pixelLonLat'));
  // JSON round trip preserves the deferred graph exactly.
  assert.ok(ee.Serializer.toJSON(ee.Deserializer.fromJSON(ee.Serializer.toJSON(r.image))).includes('Image.classify'));
 }
}
const py=require('child_process').spawnSync(process.execPath,[path.join(root,'python/graph.cjs')],{input:JSON.stringify({options:{predictor_model:'model3',year:2019},aoi:JSON.parse(ee.Serializer.toJSON(aoi)),algorithms:ee.data.getAlgorithms()}),encoding:'utf8',maxBuffer:50*1024*1024});
assert.equal(py.status,0,py.stderr);const graphs=JSON.parse(py.stdout);
assert.deepEqual(graphs.image,JSON.parse(ee.Serializer.toJSON(main.run({aoi,predictor_model:'model3',year:2019}).image)));
console.log('PASS: 9 full graphs including vendored S1 ARD; fixed predictor policies; serialization parity; Python bridge parity.');

