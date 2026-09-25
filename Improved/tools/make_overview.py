"""Generate real GEE outputs and a square 3 x 3 scientific overview.

Run with the release's Python requirements plus matplotlib and Pillow installed.
No Drive exports are created. Local thumbnails are used only for this figure.
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'python'))
import ee
from chgee import run

parser=argparse.ArgumentParser()
parser.add_argument('--project',default='ee-calvites1990')
parser.add_argument('--aoi',default='projects/ee-calvites1990/assets/aoi_sardinia_4326')
parser.add_argument('--model',choices=['model1','model2','model3'])
parser.add_argument('--render-only',action='store_true')
args=parser.parse_args()
cache=ROOT/'validation'/'overview'
cache.mkdir(parents=True,exist_ok=True)
palette=['440154','443983','31688e','21918c','35b779','90d743','fde725']
if not args.render_only:
 ee.Initialize(project=args.project)
 aoi=ee.FeatureCollection(args.aoi)
 coords=aoi.geometry().bounds(10,ee.Projection('EPSG:32632')).coordinates().getInfo()[0]
 xs=[c[0] for c in coords];ys=[c[1] for c in coords]
 cx,cy=aoi.geometry().centroid(10,ee.Projection('EPSG:32632')).coordinates().getInfo()
 side=6000
 region=ee.Geometry.Rectangle([cx-side/2,cy-side/2,cx+side/2,cy+side/2],proj='EPSG:32632',geodesic=False)
 (cache/'settings.json').write_text(json.dumps({'aoi':args.aoi,'year':2019,'algorithm':'RF','trees':500,'square_side_m':side,'display_crs':'EPSG:32632','display_scale_m':30,'centre_utm':[cx,cy],'colour_limits_m':[0,20],'reference':'rh95','forest_mask':'none','gedi_start':'2019-01-01','gedi_end_exclusive':'2020-12-31'},indent=2))
 for model in ([args.model] if args.model else ['model1','model2','model3']):
  graph_path=cache/(model+'_image.json')
  report_path=cache/(model+'_report.json')
  if not graph_path.exists() or not report_path.exists():
   print('Computing',model,flush=True)
   result=run(aoi,predictor_model=model,numTreesRF=500)
   report=ee.Dictionary({'metrics':result.metrics,'importance':result.importance,
     'rows':result.validation.toList(50000).map(lambda f:ee.Feature(f).toDictionary(['rh','classification']))}).getInfo()
   report_path.write_text(json.dumps(report,indent=2))
   graph_path.write_text(ee.serializer.toJSON(result.image))
   print(model,report['metrics'],flush=True)
  if not (cache/(model+'_detail20.png')).exists():
   image=ee.Image(ee.deserializer.fromJSON(graph_path.read_text()))
   preview=image.reproject(crs='EPSG:32632',scale=30)
   url=preview.getThumbURL({'region':region,'crs':'EPSG:32632','dimensions':'700x700','min':0,'max':20,'palette':palette,'format':'png'})
   with urllib.request.urlopen(url,timeout=600) as response:
    (cache/(model+'_detail20.png')).write_bytes(response.read())
   print('Map downloaded:',model,flush=True)

if args.model:
 raise SystemExit(0)

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap,Normalize
from matplotlib.cm import ScalarMappable
from PIL import Image

reports=[json.loads((cache/(m+'_report.json')).read_text()) for m in ['model1','model2','model3']]
for report in reports:
 x=np.array([r['rh'] for r in report['rows']]);y=np.array([r['classification'] for r in report['rows']])
 rmse=np.sqrt(np.mean((y-x)**2));r2=1-((y-x)**2).sum()/((x-x.mean())**2).sum()
 assert np.isclose(rmse,report['metrics']['rmse_m']), 'RMSE audit failed'
 assert np.isclose(r2,report['metrics']['r2']), 'R2 audit failed'
 assert np.isclose(100*rmse/abs(x.mean()),report['metrics']['rmse_percent']), 'RMSE% audit failed'

plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.labelsize':10,'axes.titlesize':13,'axes.spines.top':False,'axes.spines.right':False})
fig=plt.figure(figsize=(13.5,13.5),facecolor='white')
grid=fig.add_gridspec(3,3,left=.065,right=.97,bottom=.12,top=.86,wspace=.35,hspace=.40)
titles=['Pred 1 | Original','Pred 2 | Sentinel + terrain','Pred 3 | AlphaEarth + terrain']
subtitles=['S1 + S2 + GMTED','S1 + S2 + Copernicus + XY','64 embeddings + Copernicus + XY']
all_heights=[v for r in reports for row in r['rows'] for v in [row['rh'],row['classification']]]
height_max=max(30,5*np.ceil(max(all_heights)/5))
vmax=max(100*v/sum(r['importance'].values()) for r in reports for v in r['importance'].values())
vmax=5*np.ceil(vmax/5)
cmap=LinearSegmentedColormap.from_list('chgee',['#'+v for v in palette])
letters='abcdefghi'
for col,(model,report) in enumerate(zip(['model1','model2','model3'],reports)):
 ax=fig.add_subplot(grid[0,col]);ax.imshow(Image.open(cache/(model+'_detail20.png')));ax.set_axis_off()
 ax.set_title(titles[col]+'\n'+subtitles[col],pad=14,fontweight='medium',fontsize=12)
 ax.text(-.02,1.015,letters[col],transform=ax.transAxes,fontweight='bold',fontsize=14)
 cb=fig.colorbar(ScalarMappable(norm=Normalize(0,20),cmap=cmap),ax=ax,orientation='horizontal',fraction=.045,pad=.035,extend='max')
 cb.set_label('Canopy height (m)');cb.outline.set_visible(False)
 ax=fig.add_subplot(grid[1,col]);x=[r['rh'] for r in report['rows']];y=[r['classification'] for r in report['rows']]
 ax.scatter(x,y,s=17,color='#287c73',alpha=.65,edgecolors='none',rasterized=True)
 ax.plot([0,height_max],[0,height_max],color='#9a9a9a',lw=1,ls='--')
 ax.set(xlim=(0,height_max),ylim=(0,height_max),xlabel='GEDI reference height (m)',ylabel='Predicted height (m)');ax.set_aspect('equal')
 ax.grid(alpha=.15);m=report['metrics']
 ax.text(.04,.96,f"RMSE {m['rmse_m']:.2f} m ({m['rmse_percent']:.1f}%)\nR² {m['r2']:.3f} · n = {len(x)}",transform=ax.transAxes,va='top',fontsize=10)
 ax.text(-.13,1.04,letters[3+col],transform=ax.transAxes,fontweight='bold',fontsize=14)
 ax=fig.add_subplot(grid[2,col]);imp=report['importance'];total=sum(imp.values());keys=sorted(imp,key=imp.get,reverse=True)[:15][::-1]
 ax.barh(keys,[100*imp[k]/total for k in keys],color='#287c73',height=.7)
 ax.set_xlim(0,vmax);ax.set_xlabel('Relative importance (%)');ax.tick_params(axis='y',labelsize=8.5)
 ax.set_title(f"Variable importance · {m['predictors_selected']}/{m['predictors_original']} retained",fontsize=10)
 ax.text(-.13,1.06,letters[6+col],transform=ax.transAxes,fontweight='bold',fontsize=14);ax.xaxis.grid(alpha=.15);ax.set_axisbelow(True)
fig.suptitle('CH-GEE Improved | Three predictor sets',x=.065,ha='left',y=.97,fontsize=22,fontweight='medium',color='#263238')
fig.text(.065,.935,'AOI · 2019 · Random Forest (500 trees) · GEDI RH95',fontsize=12,color='#64717a')
fig.text(.065,.026,'Maps: common square extent, 6 × 6 km crop, 30 m preview, fixed 0–20 m colour range. Scatter plots: held-out GEDI over the full AOI.\nEach workflow uses its own test split; this is an illustrative overview, not a common-test benchmark. Importance: top 15, normalised over all retained variables.',fontsize=8.8,color='#53616b',linespacing=1.6)
out=ROOT/'figures';out.mkdir(exist_ok=True)
fig.savefig(out/'predictor_overview.png',dpi=200,facecolor='white')
fig.savefig(out/'predictor_overview.pdf',facecolor='white')
plt.close(fig)
print('Square figure saved; metrics audited from all test rows.',flush=True)


