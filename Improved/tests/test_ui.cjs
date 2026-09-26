// Exercise the actual UI controller with the real EE SDK graph builder and queued server replies.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),ee=require('@google/earthengine');
const root=path.resolve(__dirname,'..');ee.data.getAlgorithms=()=>JSON.parse(fs.readFileSync(path.join(root,'tests/algorithms.json')));ee.initialize();
const pending=[],graphs=[];ee.ComputedObject.prototype.evaluate=function(cb){graphs.push(ee.Serializer.toJSON(this));pending.push(cb);};
function widget(o){o=o||{};let value=o.value,style={...o.style},list=[];return {o,fieldGroup:null,getValue:()=>value,setValue(v){value=v;return this;},style:()=>({set(k,v){if(typeof k==='object')Object.assign(style,k);else style[k]=v;},get:k=>style[k]}),add(x){list.push(x);return this;},remove(){},clear(){list=[];},widgets:()=>({reset(){},insert(){}}),layers:()=>({reset(){},add(){},length:()=>0}),onChange(fn){this.change=fn;},setLabel(v){this.label=v;},setDisabled(v){this.disabled=v;},setOptions(){},setControlVisibility(){},setFirstPanel(){},setSecondPanel(){},setWipe(v){this.wipe=v;},centerObject(...args){this.lastCenter=args;},addLayer(){},setVisParams(){},setChartType(){return this;},drawingTools:()=>({setShown(){},layers:()=>({reset(){},length:()=>0}),setShape(){},draw(){}})};}
const ui={util:{setTimeout:fn=>fn()},SplitPanel:widget,Panel:widget,Label:(v,s)=>widget({value:v,style:s}),Select:widget,Textbox:widget,Slider:widget,Button:widget,Checkbox:widget,Map:widget,Chart:widget,Thumbnail:widget,root:widget()};ui.Panel.Layout={flow:()=>null};ui.Map.Layer=widget;const linkedEvents=[];ui.Map.Linker=(maps,event)=>{linkedEvents.push(event);return {};};
const modules={};function load(name){if(modules[name])return modules[name];if(name.startsWith('users/adugnagirma/'))return {s1_preproc:()=>[null,ee.ImageCollection([ee.Image.constant([1,2]).rename(['VH','VV'])])]};const ctx={ee,ui,exports:{},require:load,print(){}};vm.runInNewContext(fs.readFileSync(path.join(root,name.split(':').pop()+'.js'),'utf8'),ctx);return modules[name]=ctx.exports;}
const ctx={ee,ui,require:load,print(){}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'CH-GEE.js'),'utf8'),ctx);
assert.equal(ctx.appMap.lastCenter.length,1);assert.equal(linkedEvents.length,0);
assert.equal(Object.keys(ctx.recipes).length,2);assert.equal(ctx.clouds.o.min,0);assert.equal(ctx.clouds.o.max,100);
assert.equal(ctx.rh.o.min,0);assert.equal(ctx.rh.o.max,100);
ctx.average.o.onChange(true);assert.equal(ctx.rh.disabled,true);ctx.average.o.onChange(false);
ctx.gediToggle.o.onClick();assert.equal(ctx.gediSettings.style().get('shown'),true);
ctx.forest.setValue('Dynamic World');ctx.updateMask();assert.equal(ctx.categoryWidgets.length,9);
assert.equal(ctx.categoryWidgets[1].widget.getValue(),true);
ctx.forest.setValue('FNF');ctx.updateMask();assert.equal(ctx.categoryWidgets.length,4);
ctx.forest.setValue('None');ctx.updateMask();assert.equal(ctx.categoryWidgets.length,0);
const rows=Array.from({length:40},(_,i)=>({rh:10+i/10,x:i,source_id:String(i),split_u:i/40}));
const report={metrics:{rmse_m:2,rmse_percent:20,r2:.6,test_n:12,training_n:28,predictors_original:1,predictors_selected:1},predictions:rows.map(r=>({rh:r.rh,classification:r.rh+1})),importance:{x:2}};
ctx.runMapper();pending.shift()(1000000,null);pending.shift()({bands:['x'],rows},null);assert.equal(pending.length,1);pending.shift()(report,null);
assert.equal(ctx.run.disabled,false);assert.ok(ctx.heightLayer);assert.equal(ctx.sidebar.style().get('shown'),false);
const before=graphs.length;ctx.paletteChoice.setValue('Forest');ctx.updateDisplay();ctx.setMenu(true);ctx.runMapper();assert.equal(graphs.length,before);
ctx.trees.setValue('250');ctx.runMapper();assert.equal(graphs.length,before+1);pending.shift()(report,null);
ctx.reset.o.onClick();ctx.runMapper();ctx.reset.o.onClick();pending.shift()(1000000,null);assert.equal(pending.length,0,'Reset discards late callbacks');
ctx.dataset.setValue('Pred 1 · S1 + S2 + GMTED');ctx.runMapper();pending.shift()(1000000,null);assert.equal(pending.length,1,'Original goes directly to evaluation, without improved sampling');pending.shift()(report,null);
console.log('PASS: one map, two predictors, original dispatch, slider, cache, palette and stale-response protection.');
assert.equal(typeof ctx.chartToggle,'undefined');
assert.deepEqual(Array.from(ctx.chartChoice.o.items),['Summary table','Scatter plot','Variable importance']);
for(const choice of ['Summary table','Variable importance','Scatter plot']){ctx.chartChoice.setValue(choice);ctx.chartChoice.change();assert.equal(ctx.results.style().get('shown'),true);}
const plots=load('users/calvites1990/CH-GEE_Improved:ForPlots');
const importance=plots.importanceFromValues({retainedA:3,retainedB:1,discarded:100},['retainedA','retainedB']);
assert.equal(importance.o.dataTable.length,3);assert.equal(importance.o.dataTable[1][1],75);assert.equal(importance.o.dataTable[2][1],25);
const many=Object.fromEntries(Array.from({length:19},(_,i)=>['b'+i,i+1]));
assert.equal(plots.importanceFromValues(many).o.dataTable.length,20,'Display every final predictor, not only the top 15');
console.log('PASS: result selector, visible summary and final-model importance with all retained predictors.');

