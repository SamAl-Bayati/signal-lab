export const FILTER_TYPES = [
  { value: "none", label: "No filter" },
  { value: "lowpass", label: "Low-pass" },
  { value: "highpass", label: "High-pass" },
  { value: "bandpass", label: "Band-pass" },
];

export const DEFAULT_FILTER_CONFIG = {
  type: "none",
  lowCutHz: 20,
  highCutHz: 450,
};

export const DEFAULT_SAMPLING_RATE = 1000;

export const MAX_SPECTRUM_POINTS = 4096;
