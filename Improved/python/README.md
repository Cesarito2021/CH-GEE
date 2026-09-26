# CH-GEE Improved — Python function

## 1. Access and create your account

Use a Google account and [register a Cloud project for Earth Engine](https://developers.google.com/earth-engine/guides/access).
Python uses Earth Engine; moving execution to Python does not remove its quotas.
No Python app or local machine-learning substitute is included.

## 2. Install

Download this complete `CH-GEE_Improved` directory, not only `chgee.py`.
Install Python 3.10+ and [Node.js](https://nodejs.org/). In this directory's parent:

```sh
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r python/requirements.txt
npm ci
```

The local Node helper constructs the exact shared main's Earth Engine graph.
It receives settings and algorithm signatures, never account credentials.
The S1 dependency is the official upstream ARD code pinned in `vendor/`.
The Code Editor uses the original hosted ARD dependency; upstream revisions
should be checked when updating Sentinel-1 processing.

## 3. Authenticate

```python
import ee
ee.Authenticate()  # First use; follow the interactive Google sign-in.
ee.Initialize(project="your-registered-project-id")
```

See [Google's Python setup guide](https://developers.google.com/earth-engine/guides/python_install).
Do not commit credentials or service-account keys to the repository.

## 4. Select your study area and run

Run from `python/`, or add that directory to your Python import path:

```python
from chgee import run
aoi = ee.FeatureCollection("projects/your-project/assets/your-aoi")
result = run(aoi, year=2019, predictor_model="model2", model="RF",
             numTreesRF=500, quantile="rh95", mask="none")
print(result.evaluate())
```

Use `model1` or `model2` for predictor sets; use `RF`, `GBM` or `CART`
for the regression algorithm. Supported settings match `Config.js`. Pred 1 has
no selection; Pred 2/3 always apply the mean-importance rule. GEDI end dates
are exclusive. For Pred 2/3, `beams="strong"` and `acquisition="nighttime"`
are optional. A GeoJSON FeatureCollection or an `ee.FeatureCollection` also works.

By default samples are materialized once before fitting, matching the app.
`materialize=False` is an explicit deferred/batch option; sample realizations
can differ between these execution modes. Default mode caps the local table
at 50,000 rows. A large map can still exceed Earth Engine limits.

## 5. Outputs and optional exports

`result.image` contains the `predicted` band in metres. `result.metrics` contains
RMSE (m), RMSE%, R², MAE, bias, sample counts and selected variables.
`result.validation` contains `rh` and `classification` for the scatter plot;
`result.importance` contains final model importance. All remain EE objects
until evaluated. Get map tiles with `result.image.getMapId(...)` if needed.

```python
# Optional tasks; nothing is submitted until start=True or task.start().
tasks = result.export_to_drive(description="CH_GEE_Pred2_2019", start=False)
# for task in tasks: task.start()
# print([task.status() for task in tasks])
```

Exports are a 10 m GeoTIFF and a CSV of metrics. They are independent of the
100 m app preview. To save scatter/importance figures locally, install
`matplotlib` and use `plots.py`; it never launches an app or exports a map.

## Incoming updates

The Python function is included in this release. Future work: remove the local
Node dependency only after validating a native Python translation against this
shared implementation. No conformal or Python UI is planned for this release.
