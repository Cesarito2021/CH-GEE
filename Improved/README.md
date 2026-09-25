# CH-GEE Improved

Canopy height mapping with three predictor sets, a single-map Earth Engine UI,
and a Python function for the same Earth Engine workflow. This is a separate
version: the published CH-GEE and the experimental V1 are preserved.

## Access and account setup

1. Use a Google account and [register a Cloud project for Earth Engine](https://developers.google.com/earth-engine/guides/access).
2. Open the [Earth Engine Code Editor](https://code.earthengine.google.com/) and select your registered project.
3. Open the [Improved scripts](https://code.earthengine.google.com/?accept_repo=users/calvites1990/CH-GEE_Improved) if shared with you. Alternatively, paste `dist/CH-GEE.js` into a new script. The bundled script does not require the Improved repository to be installed; Sentinel-1 uses the original external ARD library.
4. Run `CH-GEE` to open the UI. This is a Code Editor release for inspection; it does not replace the existing published web app.

## Select your study area

Draw a polygon, or supply a polygon FeatureCollection asset ID. The demonstration
asset is `projects/ee-calvites1990/assets/aoi_sardinia_4326`; it requires access.
Other users should replace it with their own asset. Choose the reference dates,
predictor year and forest mask, then select a predictor set and algorithm.
The app accepts areas up to 30,000 ha and up to 50,000 extracted rows.
For larger areas use the function; successful computation still depends on
Earth Engine quotas, available GEDI observations and predictor coverage.

## Predictor sets

| Set | Predictors | Candidates | Temporal composite | Variable selection |
|---|---|---:|---|---|
| Pred 1 | Sentinel-1, Sentinel-2, GMTED2010 elevation/slope/aspect (~232 m) | 17 | Original S1 mean, S2 median | None; original workflow |
| Pred 2 | Sentinel-1, Sentinel-2, Copernicus elevation/slope/aspect (30 m), longitude/latitude | 19 | S1 median, S2 median | Training importance ≥ its mean |
| Pred 3 | Annual AlphaEarth embeddings, Copernicus elevation/slope/aspect (30 m), longitude/latitude | 69 | Annual embedding product | Training importance ≥ its mean |

RF, gradient tree boosting and CART are regression algorithms, independent of
the predictor set. Pred 1 is an adapter around the original source snapshot,
including its sampling, predictors and 70/30 partition. Pred 2 and 3 use the
CH-GEE buffered sampling design, a stable 70/30 training/test split, optional
GEDI beam/day-night filters, and discard reference RH values greater than 50 m.
There is no separate calibration subset. This release excludes conformal,
HLS, medoid and experimental grid/spatial sampling options.

For Pred 2/3, variable selection fits all candidates on training data, retains
variables whose importance is at least the mean, then fits once with the
reduced set. Relative importance is `100 × importance / sum(importance)`.
The thresholds are therefore **100/19 = 5.263%** and **100/69 = 1.449%**.
They are mathematical mean thresholds, not fitted constants or significance
levels. If importance is unavailable or zero, all candidates are retained.
This is a heuristic inspired by [SelectFromModel's mean threshold](https://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.SelectFromModel.html),
not Boruta, permutation importance or proof of an optimal subset. Correlated
predictors can share importance. Testing observations do not select variables.

## Sampling and resolution

The regional workflow samples within distributed buffers; it does not guarantee
a minimum distance between every pair of GEDI observations. The original
area-dependent sampling scales are retained:

| AOI area (ha) | Sampling scale (m) |
|---:|---:|
| ≤4,000 | 10 |
| >4,000 and <10,000 | 50 |
| ≥10,000 and <330,000 | 100 |
| ≥330,000 and <2,200,000 | 200 |
| ≥2,200,000 | 250 |

These sampling scales differ from the **10 m output grid**. Resampling terrain
or embeddings to that grid does not create 10 m independent source information.
Pred 2/3 use a separate 100 m display preview to reduce map rendering work;
exports use the underlying prediction at 10 m. Pred 1 retains its original
display behavior. The map centres on the selected AOI. Palette and display range
changes do not retrain the model. Auto range uses displayed test predictions;
the maximum can be changed manually if the full map extends beyond that range.

## Run the Earth Engine function

`Run_Local.js` displays the map, evaluation, scatter plot and importance.
`Run_And_Export.js` creates optional Drive tasks. The app itself has no download
button. Use the matching files in `dist/` to run without installing all modules.

```javascript
var mapper = require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var aoi = ee.FeatureCollection('projects/your-project/assets/your-aoi');
mapper.runAsync({aoi:aoi, year:2019, predictor_model:'model3', model:'RF',
  numTreesRF:500, mask:'none'}, function(result,error) {
  if (error) { print(error); return; }
  Map.centerObject(aoi);
  Map.addLayer(result.image, {min:0,max:30,
    palette:['440154','443983','31688e','21918c','35b779','90d743','fde725']},
    'Canopy height (m)');
  print('Evaluation', result.metrics);
});
```

`runAsync` materializes samples before fitting, like the app. `run` creates a
deferred computation for batch use. These execution modes may produce different
sample tables because of server execution/projection behavior; use the same mode
when reproducing results. Training/testing counts and selected variables are
returned for auditing. App runs with identical settings reuse completed results;
changing only model hyperparameters reuses extracted predictor rows.

## Python function

See [python/README.md](python/README.md). Python launches **no app**. Its public
`run()` returns `ee.Image`, metrics, testing observations, selected predictors
and importance. Python performs authentication, evaluation and optional exports.
A local Node.js helper uses the shared JavaScript main to construct the
computation; this is deliberately a shared implementation, not a separately
translated model. Earth Engine still processes the data and its quotas apply.

## Interpret the results

RMSE is in metres. `RMSE% = 100 × RMSE / abs(mean testing GEDI height)`;
it is not the percentage of trees predicted correctly, nor a per-pixel error.
`R² = 1 − SSE/SST` on the held-out GEDI observations and can be negative.
MAE and bias are in metres; positive bias means overprediction. These measure
agreement with held-out GEDI reference data, not independent field validation.
Random holdout does not remove spatial autocorrelation. A fair scientific
comparison should also keep test references and evaluation settings fixed.
The app scatter plot uses at most 1,500 test rows; metrics use all test rows.

## Files and maintenance

- `CH-GEE.js`: single-map UI; original filenames organize the other modules.
- `LegacyPredictor.js`: original source snapshot and return-value adapter.
- `code_editor/`: modular copies ready to paste under `CH-GEE_Improved`.
- `dist/`: standalone UI, library and function bundles.
- `python/`: Python entry point and shared computation bridge.
- `vendor/gee_s1_ard/`: official Sentinel-1 ARD source, pinned revision and MIT licence for Python.
- `validation/`: verification notes, without credentials or exported maps.

Build/check with Node.js: `npm ci`, `npm test`, `npm run build`.
Edit the root source modules, then rebuild. Do not edit generated copies directly.
The top-level project follows the original repository's GPL-3.0 licence;
third-party ARD code retains its MIT licence.

## Sources

- Alvites et al. (2024), *High-Resolution Canopy Height Mapping: Integrating NASA's GEDI with Multi-Source Remote Sensing Data*, [Remote Sensing 16, 1281](https://doi.org/10.3390/rs16071281).
- Alvites et al. (2025), *Canopy height Mapper: A google earth engine application for predicting global canopy heights combining GEDI with multi-source data*, [Environmental Modelling & Software 183, 106268](https://doi.org/10.1016/j.envsoft.2024.106268).
- Mullissa et al. (2021), [Sentinel-1 SAR Backscatter Analysis Ready Data Preparation in Google Earth Engine](https://doi.org/10.3390/rs13101954); [official code](https://github.com/adugnag/gee_s1_ard).
- Gorelick, [Random samples with buffering](https://medium.com/google-earth/random-samples-with-buffering-6c8737384f8c), inspiration for CH-GEE's original sampling design.
- Dataset catalogues: [AlphaEarth](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL), [Copernicus DEM](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30), [GEDI L2A](https://developers.google.com/earth-engine/datasets/catalog/LARSE_GEDI_GEDI02_A_002_MONTHLY).
