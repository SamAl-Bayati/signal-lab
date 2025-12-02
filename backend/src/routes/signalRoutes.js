const express = require("express");
const {
  SAMPLE_DATASETS,
  getDatasetById,
} = require("../sample-data/sampleDatasets");
const { summarizeDataset } = require("../utils/signalUtils");

const router = express.Router();

router.get("/datasets", (req, res) => {
  const datasets = SAMPLE_DATASETS.map(summarizeDataset);
  res.json({ datasets });
});

router.get("/datasets/:id", (req, res) => {
  const ds = getDatasetById(req.params.id);
  if (!ds) {
    return res.status(404).json({ error: "Dataset not found" });
  }
  return res.json(ds);
});

module.exports = router;
