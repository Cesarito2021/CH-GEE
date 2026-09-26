# Verification — 2026-09-26

This update removes the third predictor set and its embedding library from the Improved release. Historical comparison figures are omitted because they describe a different configuration. The original CH-GEE and experimental V1 are preserved.

## Completed checks

- JavaScript graph tests: both predictor sets with RF, CART and gradient boosting; invalid configurations rejected; full dates across years, RH0, beam/time filters and multiple land-cover classes represented in the computation graphs.
- UI controller tests: two predictor choices, RH0–100 and AVG, expandable GEDI controls, nine Dynamic World categories and four FNF categories, original dispatch, caching and cancellation of stale replies.
- Python bridge tests: both predictor sets construct outputs; export tasks are created without starting them.
- Standalone and modular builds: JavaScript parses successfully.
- GEE Code Editor: updated modules saved under CH-GEE_Improved; app initializes; AOI controls remain visible at startup; new data ordering and GEDI controls render; Dynamic World category selection renders.

## Limits

No new training benchmark, RMSE comparison or full raster export was performed for this interface update. Graph/controller tests do not establish scientific accuracy or guarantee regional quota performance. The display maximum is automatically derived from available testing predictions, not a full-image maximum reduction.

Run/Reset are renamed and coloured blue/red. GEE currently renders their inner labels at 11 px despite the widget font-size setting; the requested font enlargement remains unresolved. The existing public app has not been republished; the updated Code Editor version is available for review.

## Download separation

CH-GEE.js only displays maps and diagnostics. Run_And_Export.js calls the same main and creates Drive export tasks; users start them in the Code Editor Tasks tab. There is no local/app mode switch, and processing still runs on Earth Engine.
