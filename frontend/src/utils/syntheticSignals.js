// Synthetic EMG / EEG style sample datasets for Signal Lab.
// Used only when the backend (S3-backed sample datasets) is unavailable.

import { DEFAULT_SAMPLING_RATE } from "../config/constants";

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateEmgGripRest() {
  const samplingRate = 1000;
  const seconds = 3;
  const total = samplingRate * seconds;
  const data = [];
  const labels = [];

  for (let i = 0; i < total; i += 1) {
    const t = i / samplingRate;
    const isGrip = t > 1 && t < 2;
    const noise = randn() * 0.05;
    const burst = isGrip
      ? Math.sin(2 * Math.PI * 50 * t) * 0.8 + randn() * 0.1
      : 0;
    data.push(noise + burst);
    labels.push(isGrip ? "grip" : "rest");
  }

  return {
    id: "emg_grip_rest",
    name: "Synthetic EMG: Grip vs Rest",
    type: "EMG",
    samplingRate,
    channels: [
      {
        id: "ch1",
        label: "EMG Channel 1",
        data,
      },
    ],
    labels,
    meta: {
      description:
        "Simulated forearm EMG with a grip burst between 1 and 2 seconds.",
      source: "synthetic-fallback",
    },
  };
}

function generateEegAlpha() {
  const samplingRate = 250;
  const seconds = 4;
  const total = samplingRate * seconds;
  const data = [];
  const labels = [];

  for (let i = 0; i < total; i += 1) {
    const t = i / samplingRate;
    const alpha = Math.sin(2 * Math.PI * 10 * t);
    const slowDrift = Math.sin(2 * Math.PI * 1 * t) * 0.1;
    const noise = randn() * 0.05;
    data.push(alpha * 0.5 + slowDrift + noise);
    labels.push("eeg-alpha");
  }

  return {
    id: "eeg_alpha",
    name: "Synthetic EEG: Alpha Rhythm",
    type: "EEG",
    samplingRate,
    channels: [
      {
        id: "ch1",
        label: "EEG Channel (Occipital-like)",
        data,
      },
    ],
    labels,
    meta: {
      description: "Simulated EEG with a dominant 10 Hz alpha component.",
      source: "synthetic-fallback",
    },
  };
}

export function createSyntheticDatasets() {
  const emg = generateEmgGripRest();
  const eeg = generateEegAlpha();

  return [emg, eeg].map((ds) => ({
    ...ds,
    samplingRate: ds.samplingRate || DEFAULT_SAMPLING_RATE,
  }));
}
