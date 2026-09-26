"""Edit PROJECT and AOI. Run from this directory after following README.md."""
import ee
from chgee import run

PROJECT = "your-earth-engine-project"
AOI = "projects/your-project/assets/your-aoi"

# Run ee.Authenticate() once interactively if credentials are not configured.
ee.Initialize(project=PROJECT)
result = run(AOI, year=2019, predictor_model="model2", model="RF", numTreesRF=500)
print(result.evaluate())
# No exports start automatically. To create and start the optional Drive tasks:
# tasks = result.export_to_drive(description="CH_GEE_Pred2_2019", start=True)
# print([task.status() for task in tasks])
