# CH-GEE Improved

Canopy height mapping with two predictor sets, a single-map Earth Engine UI,
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
predictor dates and land-cover mask, then select a predictor set and algorithm.
The app accepts areas up to 30,000 ha and up to 50,000 extracted rows.
For larger areas use the function; successful computation still depends on
Earth Engine quotas, available GEDI observations and predictor coverage.

## Predictor sets

| Set | Predictors | Candidates | Temporal composite | Variable selection |
|---|---|---:|---|---|
| Pred 1 | Sentinel-1, Sentinel-2, GMTED2010 elevation/slope/aspect (~232 m) | 17 | Original S1 mean, S2 median | None; original workflow |
| Pred 2 | Sentinel-1, Sentinel-2, Copernicus GLO-30 elevation/slope/aspect (30 m), longitude/latitude | 19 | S1 median, S2 median | Training importance ≥ its mean |

RF, gradient tree boosting and CART are regression algorithms, independent of
the predictor set. Pred 1 is an adapter around the original source snapshot,
including its sampling, predictors and 70/30 partition. Pred 2 uses the
CH-GEE buffered sampling design, a stable 70/30 training/test split, optional
GEDI beam/day-night filters, and discards reference RH values greater than 50 m.
There is no separate calibration subset. This release excludes conformal,
HLS, medoid and experimental grid/spatial sampling options.

For Pred 2, variable selection fits all candidates on training data, retains
variables whose importance is at least the mean, then fits once with the
reduced set. Relative importance is `100 × importance / sum(importance)`.
The mean threshold for Pred 2 is **100/19 = 5.263%**.
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
to that grid does not create 10 m independent source information.
Pred 2 use a separate computation requested at 100 m for the display preview;
it is an approximate preview, not a cached 10 m raster reduced for display.
This avoids forcing a full 10 m calculation before drawing a coarse map;
exports use the underlying prediction at 10 m. Pred 1 retains its original
display behavior. The map centres on the selected AOI. Palette and display range
changes do not retrain the model. Auto range uses displayed test predictions;
the display range is always automatic and does not clip exported heights.

## Run the Earth Engine function

`Run_Local.js` runs the main without an app and prints evaluation, scatter plot and importance in the Code Editor console. The map is not displayed unless `showMap=true`.
`Run_And_Export.js` creates optional Drive tasks. The app itself has no download
button. Use the matching files in `dist/` to run without installing all modules.

```javascript
var mapper = require('users/calvites1990/CH-GEE_Improved:CH-GEE_main');
var aoi = ee.FeatureCollection('projects/your-project/assets/your-aoi');
mapper.runAsync({aoi:aoi, year:2019, predictor_set:'pred2', model:'RF',
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
deferred computation for batch use. Live checks found different sample tables
between these execution modes; the precise cause was not isolated. Use the same mode
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
- `Terrain.js`: elevation, slope and aspect; no annual embeddings.

Build/check with Node.js: `npm ci`, `npm test`, `npm run build`.
Edit the root source modules, then rebuild. Do not edit generated copies directly.
The top-level project follows the original repository's GPL-3.0 licence;
third-party ARD code retains its MIT licence.

## Sources

- Alvites et al. (2024), *High-Resolution Canopy Height Mapping: Integrating NASA's GEDI with Multi-Source Remote Sensing Data*, [Remote Sensing 16, 1281](https://doi.org/10.3390/rs16071281).
- Alvites et al. (2025), *Canopy height Mapper: A google earth engine application for predicting global canopy heights combining GEDI with multi-source data*, [Environmental Modelling & Software 183, 106268](https://doi.org/10.1016/j.envsoft.2024.106268).
- Mullissa et al. (2021), [Sentinel-1 SAR Backscatter Analysis Ready Data Preparation in Google Earth Engine](https://doi.org/10.3390/rs13101954); [official code](https://github.com/adugnag/gee_s1_ard).
- Gorelick, [Random samples with buffering](https://medium.com/google-earth/random-samples-with-buffering-6c8737384f8c), inspiration for CH-GEE's original sampling design.
- Dataset catalogues: [Copernicus DEM](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_DEM_GLO30), [GEDI L2A](https://developers.google.com/earth-engine/datasets/catalog/LARSE_GEDI_GEDI02_A_002_MONTHLY).

## Interface and download workflow

The AOI selector is visible below **Input/Output options**. Data settings follow this order: GEDI temporal setting; RH slider (0–100) and AVG; expandable GEDI beam/time controls; predictor temporal setting; predictor set; cloud-cover slider; land-cover mask. Both date ranges use YYYY-MM-DD and **exclusive end dates**. A predictor interval may cross years. GEDI may cover multiple years independently.

AVG retains the existing mean of RH75, RH90, RH95 and RH100. Beam/time filters apply when explicitly selected in either predictor set; default all/all preserves the baseline. Pred 1 keeps the original predictor, sampling and training recipe and does not perform variable selection. Pred 2 keeps its existing 50 m reference-height limit.

Land-cover masking filters samples and predictions. Select one or more category IDs with maskClasses; defaults are Trees [1] for Dynamic World and forest [1,2] for FNF4. maskYear is explicit in the UI (default 2019); in functions it defaults to the predictor start year. Dynamic World uses the annual modal label; FNF4 uses the selected annual map (2017–2020). No automatic substitution of years.

- Dynamic World: 0 Water, 1 Trees, 2 Grass, 3 Flooded vegetation, 4 Crops, 5 Shrub and scrub, 6 Built, 7 Bare, 8 Snow and ice.
- FNF4: 1 Dense forest, 2 Non-dense forest, 3 Non-forest, 4 Water.

The app calls the shared main and only displays results. **No local/app switch is required.** In the Code Editor, open Run_And_Export.js, replace the AOI and settings, run it, and start the image/metrics exports in Tasks. The script also shows the map and diagnostic plots. Run_Local.js shows diagnostics in the console without creating export tasks; its map preview is optional (`showMap=true`). Exports run on Earth Engine and go to the user's Drive; they are not local computation.

To update an existing published web app, save the modules first, then use **Apps → existing app → Edit → update source and save/publish**. Running the script previews it in the Code Editor; it does not update the published URL. Keep the existing App ID to retain its URL. Libraries and AOI assets must be accessible to the app and to intended Code Editor users.

Sources: [Dynamic World catalogue](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1), [FNF4 catalogue](https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_PALSAR_YEARLY_FNF4), [GEDI catalogue](https://developers.google.com/earth-engine/datasets/catalog/LARSE_GEDI_GEDI02_A_002_MONTHLY), [Earth Engine app management](https://developers.google.com/earth-engine/guides/apps).

Known UI limitation: the Run/Reset labels and colours are updated, but the current Code Editor renderer fixes the inner button text at 11 px despite the requested 22 px widget font. The requested visible font enlargement is not yet achieved.

## Terminology and execution

A **predictor set** is a collection of input variables: `pred1` or `pred2`. A **regression model** is RF, GBM or CART. Public examples use `predictor_set`; the older `predictor_model` values `model1`/`model2` remain compatibility aliases inside the library. They are not additional regression algorithms.

The historical filename `Run_Local.js` means a Code Editor entry point, not offline computation. `CH-GEE_main` returns an `ee.Image` and diagnostics without opening an app. Evaluation requests compute diagnostics; the image remains a deferred Earth Engine object until an analysis, visualization or export requests pixels. Printing diagnostics does not materialize a complete raster file.

The published app displays the map and diagnostics without export controls. The Code Editor examples show diagnostics in the console and can optionally display or export the map. Adding libraries does not require reorganizing the published app around the original filenames. An optional export-enabled UI should have a separate explicit entry point; do not infer export mode from the execution environment or enable it in the public app.
