import {
  DEFAULT_SAMPLING_RATE,
  MAX_SPECTRUM_POINTS,
} from "../config/constants";

export function buildTimeAxis(length, samplingRate) {
  const sr = samplingRate || DEFAULT_SAMPLING_RATE;
  const dt = 1 / sr;
  const t = new Array(length);
  for (let i = 0; i < length; i += 1) {
    t[i] = i * dt;
  }
  return t;
}

// Simple first order IIR filters for demo use.
function lowPass(data, samplingRate, cutoffHz) {
  if (!cutoffHz || cutoffHz <= 0) return data;
  const dt = 1 / samplingRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = dt / (rc + dt);
  const out = new Array(data.length);
  let prev = data[0] || 0;
  out[0] = prev;
  for (let i = 1; i < data.length; i += 1) {
    prev = prev + alpha * (data[i] - prev);
    out[i] = prev;
  }
  return out;
}

function highPass(data, samplingRate, cutoffHz) {
  if (!cutoffHz || cutoffHz <= 0) return data;
  const dt = 1 / samplingRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + dt);
  const out = new Array(data.length);
  let prevY = 0;
  let prevX = data[0] || 0;
  out[0] = 0;
  for (let i = 1; i < data.length; i += 1) {
    const x = data[i];
    const y = alpha * (prevY + x - prevX);
    out[i] = y;
    prevY = y;
    prevX = x;
  }
  return out;
}

export function applyFilter(data, samplingRate, config) {
  if (!data || data.length === 0) return [];
  if (!config || config.type === "none") return data;

  const sr = samplingRate || DEFAULT_SAMPLING_RATE;

  if (config.type === "lowpass") {
    return lowPass(data, sr, config.highCutHz);
  }

  if (config.type === "highpass") {
    return highPass(data, sr, config.lowCutHz);
  }

  if (config.type === "bandpass") {
    const hp = highPass(data, sr, config.lowCutHz);
    return lowPass(hp, sr, config.highCutHz);
  }

  return data;
}

// Naive DFT on a capped number of samples for spectrum view.
export function computeSpectrum(data, samplingRate) {
  if (!data || data.length === 0) return { freqs: [], magnitudes: [] };

  const sr = samplingRate || DEFAULT_SAMPLING_RATE;
  const n = Math.min(data.length, MAX_SPECTRUM_POINTS);
  const slice = data.slice(0, n);
  const half = Math.floor(n / 2);

  const freqs = new Array(half);
  const mags = new Array(half);

  const twoPiOverN = (2 * Math.PI) / n;

  for (let k = 0; k < half; k += 1) {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t += 1) {
      const angle = twoPiOverN * k * t;
      const x = slice[t];
      re += x * Math.cos(angle);
      im -= x * Math.sin(angle);
    }
    freqs[k] = (k * sr) / n;
    mags[k] = Math.sqrt(re * re + im * im);
  }

  return { freqs, magnitudes: mags };
}

export function computeRms(data) {
  if (!data || data.length === 0) return 0;
  let acc = 0;
  for (let i = 0; i < data.length; i += 1) {
    const x = data[i];
    acc += x * x;
  }
  return Math.sqrt(acc / data.length);
}

export function classifyGripVsRest(data, samplingRate, options = {}) {
  if (!data || data.length === 0) {
    return {
      label: "No data",
      rms: 0,
      threshold: 0,
    };
  }

  const { thresholdRms, analysisWindowSeconds = 0.5 } = options;

  const sr = samplingRate || DEFAULT_SAMPLING_RATE;
  const windowSamples = Math.min(
    data.length,
    Math.floor(analysisWindowSeconds * sr)
  );

  const window = data.slice(0, windowSamples);
  const rms = computeRms(window);

  const threshold = typeof thresholdRms === "number" ? thresholdRms : 0.2;

  const label = rms >= threshold ? "Grip" : "Rest";

  return {
    label,
    rms,
    threshold,
  };
}
