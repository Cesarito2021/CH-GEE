import sys
from pathlib import Path
import unittest
from unittest.mock import patch
import ee
from ee.apitestcase import ApiTestCase
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'python'))
from chgee import run

class PythonInterfaceTest(ApiTestCase):
    def test_graphs_and_non_started_exports(self):
        aoi = ee.FeatureCollection([ee.Feature(ee.Geometry.Rectangle([9.29,39.24,9.30,39.25]))])
        for predictor in ['model1','model2']:
            with patch.object(ee.data,'computeValue',return_value=100):
                result = run(aoi, predictor_model=predictor, materialize=False)
            graph = result.image.serialize()
            self.assertIn('Image.classify',graph)
            self.assertNotIn('interval_width',graph)
            self.assertIn('rmse_percent',result.metrics.serialize())
            self.assertEqual(len(result.export_to_drive()),2)
            for task in result.export_to_drive():
                self.assertIsNone(task.id)
        with self.assertRaises(ValueError):
            run(aoi,predictor_model='invalid')

if __name__ == '__main__':
    unittest.main()
