import { describe, it, expect } from "vitest";
import {
  buildTimeAxis,
  applyFilter,
  computeSpectrum,
  computeRms,
  classifyGripVsRest,
} from "./signalProcessing";
import { DEFAULT_SAMPLING_RATE } from "../config/constants";

describe("buildTimeAxis", () => {
  it("builds a time axis of correct length and spacing", () => {
    const length = 5;
    const sr = 1000;
    const t = buildTimeAxis(length, sr);
    expect(t).toHaveLength(length);
    expect(t[0]).toBe(0);
    expect(t[1]).toBeCloseTo(1 / sr);
  });

  it("uses default sampling rate when none provided", () => {
    const length = 3;
    const t = buildTimeAxis(length);
    expect(t[1]).toBeCloseTo(1 / DEFAULT_SAMPLING_RATE);
  });
});

describe("applyFilter", () => {
  const sr = 1000;
  const data = [0, 1, 0, -1, 0];

  it("returns original data when type is none", () => {
    const out = applyFilter(data, sr, { type: "none" });
    expect(out).toHaveLength(data.length);
  });

  it("handles low-pass config", () => {
    const out = applyFilter(data, sr, { type: "lowpass", highCutHz: 50 });
    expect(out).toHaveLength(data.length);
  });

  it("handles high-pass config", () => {
    const out = applyFilter(data, sr, { type: "highpass", lowCutHz: 20 });
    expect(out).toHaveLength(data.length);
  });

  it("handles band-pass config", () => {
    const out = applyFilter(data, sr, {
      type: "bandpass",
      lowCutHz: 20,
      highCutHz: 450,
    });
    expect(out).toHaveLength(data.length);
  });
});

describe("computeSpectrum", () => {
  it("returns empty arrays for empty input", () => {
    const spec = computeSpectrum([], DEFAULT_SAMPLING_RATE);
    expect(spec.freqs).toHaveLength(0);
    expect(spec.magnitudes).toHaveLength(0);
  });

  it("produces non-empty spectrum for non-empty input", () => {
    const data = new Array(128)
      .fill(0)
      .map((_, i) => Math.sin((2 * Math.PI * i) / 16));
    const spec = computeSpectrum(data, DEFAULT_SAMPLING_RATE);
    expect(spec.freqs.length).toBeGreaterThan(0);
    expect(spec.magnitudes.length).toBe(spec.freqs.length);
  });
});

describe("computeRms", () => {
  it("returns 0 for empty input", () => {
    expect(computeRms([])).toBe(0);
  });

  it("computes RMS correctly", () => {
    const rms = computeRms([3, 4]);
    expect(rms).toBeCloseTo(5 / Math.SQRT2);
  });
});

describe("classifyGripVsRest", () => {
  it("returns No data for empty input", () => {
    const result = classifyGripVsRest([], DEFAULT_SAMPLING_RATE, {
      thresholdRms: 0.1,
    });
    expect(result.label).toBe("No data");
  });

  it("classifies high amplitude as Grip", () => {
    const data = new Array(100).fill(1);
    const result = classifyGripVsRest(data, DEFAULT_SAMPLING_RATE, {
      thresholdRms: 0.2,
    });
    expect(result.label).toBe("Grip");
  });

  it("classifies low amplitude as Rest", () => {
    const data = new Array(100).fill(0.01);
    const result = classifyGripVsRest(data, DEFAULT_SAMPLING_RATE, {
      thresholdRms: 0.2,
    });
    expect(result.label).toBe("Rest");
  });
});
