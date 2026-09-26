"""Python API for the shared CH-GEE Improved Earth Engine computation.

No app is launched. A local Node helper builds the same deferred EE graph from
the JavaScript main; authentication, evaluation and exports use Python's EE API.
Install Node.js and run npm ci in the project root before using this module.
"""
from dataclasses import dataclass
import json
from pathlib import Path
import shutil
import subprocess
import ee

ROOT = Path(__file__).resolve().parents[1]

@dataclass
class Result:
    image: ee.Image
    metrics: ee.Dictionary
    validation: ee.FeatureCollection
    importance: ee.Dictionary
    selected_predictors: ee.List
    region: ee.Geometry

    def evaluate(self):
        """Evaluate all test metrics; no map download or export is started."""
        return self.metrics.getInfo()

    def export_to_drive(self, description="CH_GEE_Improved", folder="CH_GEE",
                        crs="EPSG:4326", start=False):
        """Return image and metrics tasks. Start only when explicitly requested."""
        tasks = [
            ee.batch.Export.image.toDrive(
                image=self.image.toFloat().unmask(-9999), description=description,
                folder=folder, region=self.region, scale=10, crs=crs,
                maxPixels=1e13, fileFormat="GeoTIFF",
                formatOptions={"cloudOptimized": True, "noData": -9999}),
            ee.batch.Export.table.toDrive(
                collection=ee.FeatureCollection([ee.Feature(None, self.metrics)]),
                description=description+"_metrics", folder=folder, fileFormat="CSV")
        ]
        if start:
            for task in tasks:
                task.start()
        return tasks


def run(aoi, year=2019, predictor_model=None, model="RF", node=None, materialize=True, predictor_set=None, **options):
    """Return the 10 m exportable prediction and test outputs as EE objects.

    aoi: polygon asset ID, GeoJSON FeatureCollection, or ee.FeatureCollection.
    predictor_set: pred1 (original), pred2 (S1/S2 + GLO-30 + coordinates; default).
    model: RF, GBM or CART regression algorithm.
    predictor_model: compatibility alias accepting model1/model2; prefer predictor_set.
    options: same named settings as Config.js. Selection is fixed by predictor set.
    materialize: freeze predictor samples before fitting, as in the app (default).
        False builds a wholly deferred graph, suitable for larger batch workflows.
    Call ee.Initialize(project=...) first. Earth Engine quotas still apply.
    """
    executable = node or shutil.which("node")
    if not executable:
        raise RuntimeError("Install Node.js, then run npm ci in CH-GEE_Improved.")
    if predictor_set is not None:
        if predictor_set not in ("pred1", "pred2"):
            raise ValueError("predictor_set must be pred1 or pred2")
        mapped = {"pred1": "model1", "pred2": "model2"}[predictor_set]
        if predictor_model is not None and predictor_model != mapped:
            raise ValueError("Conflicting predictor set options")
        predictor_model = mapped
    if predictor_model is None:
        predictor_model = "model2"
    if predictor_model not in ("model1", "model2"):
        raise ValueError("predictor_model must be model1 or model2")
    fc = ee.FeatureCollection(aoi)
    options.update(year=year, predictor_model=predictor_model, model=model)
    # The original main selects a client-side area branch. Resolve that scalar
    # here; the improved predictor set remains entirely deferred.
    if predictor_model == "model1":
        options["areaHa"] = fc.geometry().area(1).divide(10000).round().getInfo()
    payload = {"options": options, "aoi": json.loads(ee.serializer.toJSON(fc)),
               "algorithms": ee.data.getAlgorithms()}
    def build(p):
        proc = subprocess.run([str(executable), str(ROOT / "python" / "graph.cjs")],
                              input=json.dumps(p), text=True, encoding="utf-8",
                              capture_output=True, timeout=180, check=False)
        if proc.returncode:
            raise RuntimeError("Unable to build CH-GEE computation: " + proc.stderr.strip())
        return json.loads(proc.stdout)
    if materialize and predictor_model != 'model1':
        prepared=build(dict(payload,stage='prepare'))
        table=ee.Dictionary(ee.deserializer.decode(prepared['payload'])).getInfo()
        if len(table['rows'])>50000:
            raise ValueError('More than 50,000 samples: use a smaller AOI or materialize=False for batch computation.')
        if sum(r['split_u']<0.7 for r in table['rows'])<20 or sum(r['split_u']>=0.7 for r in table['rows'])<5:
            raise ValueError('Too few usable training/testing observations. Adjust the area or dates.')
        graphs=build(dict(payload,stage='fit',image=prepared['image'],rows=table['rows'],bands=table['bands']))
    else:
        graphs=build(payload)
    def decode(key):
        return ee.deserializer.decode(graphs[key])
    return Result(ee.Image(decode("image")), ee.Dictionary(decode("metrics")),
                  ee.FeatureCollection(decode("validation")), ee.Dictionary(decode("importance")),
                  ee.List(decode("bands")), fc.geometry())
