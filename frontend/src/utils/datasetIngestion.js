import { DEFAULT_SAMPLING_RATE } from "../config/constants";

export const DATASET_TYPES = {
  CUSTOM: "Custom",
};

export const DATASET_SCHEMA_VERSION = 1;

export function normalizeJsonDataset(json, fileName) {
  const samplingRate = resolveSamplingRate(json.samplingRate);

  let channels = json.channels;

  if (!channels && Array.isArray(json.data)) {
    channels = [
      {
        id: "ch1",
        label: "Channel 1",
        data: json.data,
      },
    ];
  }

  if (!Array.isArray(channels) || channels.length === 0) {
    throw new Error("Dataset must include at least one channel");
  }

  const normalizedChannels = channels.map((ch, idx) => ({
    id: ch.id || `ch${idx + 1}`,
    label: ch.label || `Channel ${idx + 1}`,
    data: normalizeNumericArray(ch.data, `Channel ${idx + 1}`),
  }));

  return {
    id: json.id || `upload_${Date.now()}`,
    name: json.name || fileName || "Uploaded dataset",
    type: json.type || DATASET_TYPES.CUSTOM,
    samplingRate,
    channels: normalizedChannels,
    labels: Array.isArray(json.labels) ? json.labels : undefined,
    meta: {
      description: json.description || "User uploaded dataset",
      schemaVersion: DATASET_SCHEMA_VERSION,
    },
  };
}

export function parseCsvDataset(text, fileName) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  const values = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const parts = line.split(",");
    const raw = parts[parts.length - 1];
    const v = Number(raw);
    if (Number.isFinite(v)) {
      values.push(v);
    }
  }

  if (values.length === 0) {
    throw new Error("No numeric values parsed from CSV");
  }

  return {
    id: `upload_${Date.now()}`,
    name: fileName || "Uploaded CSV",
    type: DATASET_TYPES.CUSTOM,
    samplingRate: DEFAULT_SAMPLING_RATE,
    channels: [
      {
        id: "ch1",
        label: "Channel 1",
        data: values,
      },
    ],
    meta: {
      description:
        "User uploaded CSV dataset. Parsed one numeric value per row or last column.",
      schemaVersion: DATASET_SCHEMA_VERSION,
    },
  };
}

function resolveSamplingRate(value) {
  const sr = Number(value);
  if (Number.isFinite(sr) && sr > 0) return sr;
  return DEFAULT_SAMPLING_RATE;
}

function normalizeNumericArray(data, label) {
  if (!Array.isArray(data)) {
    throw new Error(`${label} data must be an array of numbers`);
  }

  const out = [];

  for (let i = 0; i < data.length; i += 1) {
    const raw = data[i];
    const v = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(v)) continue;
    out.push(v);
  }

  if (out.length === 0) {
    throw new Error(`${label} contains no numeric samples`);
  }

  return out;
}
