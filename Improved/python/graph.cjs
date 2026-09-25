// Private implementation bridge: no credentials, network calls or UI.
// Evaluates the release main itself to avoid maintaining divergent algorithms.
const fs=require('fs'),path=require('path'),vm=require('vm');
const ee=require('@google/earthengine'),root=path.resolve(__dirname,'..');
try {
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 ee.data.getAlgorithms=()=>input.algorithms;ee.initialize();
 ee.data.computeValue=()=>{throw new Error('Unexpected client-side computation in graph builder');};
 const cache={};
 function load(name){
  if(cache[name])return cache[name];
  let file;
  if(/^users\/adugnagirma\/gee_s1_ard:[a-z_]+$/.test(name))file=path.join(root,'vendor','gee_s1_ard',name.split(':')[1]+'.js');
  else if(/^users\/calvites1990\/CH-GEE_Improved:[A-Za-z0-9_-]+$/.test(name))file=path.join(root,name.split(':')[1]+'.js');
  else throw new Error('Unsupported module '+name);
  const ctx={ee,require:load,exports:{},print:()=>{}};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
  return cache[name]=ctx.exports;
 }
 const main=load('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
 input.options.aoi=ee.Deserializer.fromJSON(JSON.stringify(input.aoi));
 if(input.stage==='prepare'){
  const p=main.prepare(input.options);
  process.stdout.write(JSON.stringify({image:JSON.parse(ee.Serializer.toJSON(p.image)),payload:JSON.parse(ee.Serializer.toJSON(main.samplePayload(p)))}));
  process.exit(0);
 }
 const r=input.stage==='fit'?main.fit(main.prepareFromSamples(input.options,ee.Deserializer.fromJSON(JSON.stringify(input.image)),ee.FeatureCollection(input.rows.map(r=>ee.Feature(null,r))),input.bands)):main.run(input.options),out={};
 for(const [k,v] of Object.entries({image:r.image,metrics:r.metrics,validation:r.validation,importance:ee.Dictionary(r.classifier.explain()).get('importance'),bands:r.bands}))out[k]=JSON.parse(ee.Serializer.toJSON(v));
 process.stdout.write(JSON.stringify(out));
}catch(e){process.stderr.write(e.stack+'\n');process.exitCode=1;}
