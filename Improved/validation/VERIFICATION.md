# Release verification — 24 September 2026

The independent `CH-GEE_Improved` UI was saved in the user's Earth Engine account.
The original `CH-GEE` and experimental `CH-GEE_v1` repositories were preserved.
All three predictor sets completed interactive execution on
`projects/ee-calvites1990/assets/aoi_sardinia_4326` (25,544 ha, rounded).
Settings: 2019, RF 500, RH95, no forest mask, GEDI 2019-01-01 to
2020-12-31 exclusive, all beams/day-night. Pred 1 has original sampling;
Pred 2/3 have buffered sampling and mean-importance selection.

| Predictor set | RMSE (m) | RMSE (%) | R² | Selected/candidates | Testing n |
|---|---:|---:|---:|---:|---:|
| Pred 1 | 4.17 | 65.8 | 0.321 | 17/17 | 85 |
| Pred 2 | 3.47 | 47.7 | 0.594 | 7/19 | 110 |
| Pred 3 | 3.36 | 46.2 | 0.620 | 21/69 | 110 |

These are UI smoke-test results, not a controlled common-test comparison or a
claim of general superiority. Testing references differ from the original
workflow and earlier experiments with calibration sets. Execution times were
not instrumented, so none are reported as benchmark measurements.

Python's default two-stage run reproduced the displayed Pred 3 results:
RMSE 3.35787115220378 m, RMSE% 46.222728542442084, R² 0.6195066663593013,
256 training and 110 testing observations, 21 selected variables. The map
request was accepted by Earth Engine. See `python_pred3.json` for full metrics.
No Drive raster exports were started.

An initial wholly deferred Python execution returned 258/108 observations and
22 variables. Freezing the predictor sample table before fitting, as the UI
does, restored agreement. Both modes are available explicitly; reproductions
must use the same mode. The exact cause of the server-side sampling difference
was not isolated; do not interpret it as a language-specific model change.

Local checks cover the nine predictor/algorithm combinations with the full
upstream S1 ARD graph, Python serialization, predictor-specific selection rules,
single-map UI behavior, original dispatch, cloud slider, cache reuse and stale
callbacks after Reset. Python tests construct all three predictor workflows and
verify that optional export tasks remain unstarted.

The Python API shares the JS main through a local Node helper; it is not a native
Python reimplementation. Live numerical parity was checked for Pred 3 only.
Sentinel-based Python graphs were tested locally; the hosted GEE ARD dependency
and the pinned upstream copy should be checked for changes before claiming
cross-interface numerical parity for Pred 1/2.

## Final modular deployment check

The modular app also completed Pred 3 but returned a different partition:
108 test observations, 22 selected predictors, RMSE 3.36 m, RMSE% 55.4%,
R² 0.412 (rounded UI values). Thus the numerical match reported above applies
to the standalone bundle check, not universally to the modular deployment.
The source workflow is shared, but numerical parity across every execution
path remains unconfirmed; these figures must not be pooled as one benchmark.

With a short map viewport, the old chained 10 m then 100 m display reprojection
produced a tile memory error. Removing the forced 10 m intermediate from the
preview allowed the modular map to render successfully in that viewport.
The exportable image is unchanged; its export scale remains 10 m. The preview
is an approximate 100 m computation, not an exact downsample of a saved map.
