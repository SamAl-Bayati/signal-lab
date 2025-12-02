// Synthetic EMG / EEG style sample datasets for Signal Lab.
// In production you can replace these with S3 backed datasets.

function randn() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateEmgGripRest() {
  const samplingRate = 1000; // Hz
  const seconds = 3;
  const total = samplingRate * seconds;
  const data = [];
  const labels = [];

  for (let i = 0; i < total; i += 1) {
    const t = i / samplingRate;
    const isGrip = t > 1 && t < 2; // 1 to 2 seconds is "grip"
    const noise = randn() * 0.05;
    const burst = isGrip
      ? Math.sin(2 * Math.PI * 50 * t) * 0.8 + randn() * 0.1
      : 0;
    data.push(noise + burst);
    labels.push(isGrip ? "grip" : "rest");
  }

  return { samplingRate, data, labels };
}

function generateEegAlpha() {
  const samplingRate = 250; // Hz
  const seconds = 4;
  const total = samplingRate * seconds;
  const data = [];
  const labels = [];

  for (let i = 0; i < total; i += 1) {
    const t = i / samplingRate;
    const alpha = Math.sin(2 * Math.PI * 10 * t); // 10 Hz alpha
    const slowDrift = Math.sin(2 * Math.PI * 1 * t) * 0.1;
    const noise = randn() * 0.05;
    data.push(alpha * 0.5 + slowDrift + noise);
    labels.push("eeg-alpha");
  }

  return { samplingRate, data, labels };
}

const emg = generateEmgGripRest();
const eeg = generateEegAlpha();

const SAMPLE_DATASETS = [
  {
    id: "emg_grip_rest",
    name: "Synthetic EMG: Grip vs Rest",
    type: "EMG",
    samplingRate: emg.samplingRate,
    channels: [
      {
        id: "ch1",
        label: "EMG Channel 1",
        data: emg.data,
      },
    ],
    labels: emg.labels,
    meta: {
      description:
        "Simulated forearm EMG with a grip burst between 1 and 2 seconds.",
    },
  },
  {
    id: "eeg_alpha",
    name: "Synthetic EEG: Alpha Rhythm",
    type: "EEG",
    samplingRate: eeg.samplingRate,
    channels: [
      {
        id: "ch1",
        label: "EEG Channel (Occipital-like)",
        data: eeg.data,
      },
    ],
    labels: eeg.labels,
    meta: {
      description: "Simulated EEG with a dominant 10 Hz alpha component.",
    },
  },
];

function getDatasetById(id) {
  return SAMPLE_DATASETS.find((ds) => ds.id === id);
}

module.exports = {
  SAMPLE_DATASETS,
  getDatasetById,
};
