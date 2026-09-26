"""Explicit, opt-in smoke test. No exports are started."""
import json
import sys
from pathlib import Path
import ee
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'python'))
from chgee import run
ee.Initialize(project='ee-calvites1990')
result=run('projects/ee-calvites1990/assets/aoi_sardinia_4326',predictor_model='model2')
metrics=result.evaluate()
(root/'validation/python_pred3.json').write_text(json.dumps(metrics,indent=2))
print(json.dumps(metrics),flush=True)
# Confirm that the same image is accepted for map visualization; no raster export.
result.image.getMapId({'min':0,'max':25,'palette':['440154','21918c','fde725']})
print('Map request accepted.',flush=True)
