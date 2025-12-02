import { describe, it, expect } from "vitest";
import { DEFAULT_SAMPLING_RATE } from "../config/constants";
import {
  normalizeJsonDataset,
  parseCsvDataset,
  DATASET_TYPES,
} from "./datasetIngestion";

describe("normalizeJsonDataset", () => {
  it("normalizes a minimal JSON dataset with channels", () => {
    const json = {
      samplingRate: 500,
      channels: [{ data: [0, 1, 2] }],
    };

    const ds = normalizeJsonDataset(json, "test.json");
    expect(ds.samplingRate).toBe(500);
    expect(ds.channels).toHaveLength(1);
    expect(ds.channels[0].label).toBe("Channel 1");
    expect(ds.channels[0].data).toEqual([0, 1, 2]);
    expect(ds.type).toBe(DATASET_TYPES.CUSTOM);
  });

  it("infers channels from root-level data array", () => {
    const json = {
      samplingRate: 250,
      data: [1, 2, 3],
    };

    const ds = normalizeJsonDataset(json, "root-data.json");
    expect(ds.channels).toHaveLength(1);
    expect(ds.channels[0].data).toEqual([1, 2, 3]);
    expect(ds.samplingRate).toBe(250);
  });

  it("falls back to default sampling rate when missing", () => {
    const json = {
      channels: [{ data: [1, 2, 3] }],
    };

    const ds = normalizeJsonDataset(json, "no-sr.json");
    expect(ds.samplingRate).toBe(DEFAULT_SAMPLING_RATE);
  });

  it("throws when there are no channels and no data", () => {
    expect(() => normalizeJsonDataset({}, "bad.json")).toThrow(
      /at least one channel/i
    );
  });
});

describe("parseCsvDataset", () => {
  it("parses numeric values from simple CSV", () => {
    const text = "1\n2\n3\n";
    const ds = parseCsvDataset(text, "simple.csv");
    expect(ds.channels).toHaveLength(1);
    expect(ds.channels[0].data).toEqual([1, 2, 3]);
    expect(ds.samplingRate).toBe(DEFAULT_SAMPLING_RATE);
  });

  it("parses last column from multi-column CSV", () => {
    const text = "0,1\n1,2\n2,3\n";
    const ds = parseCsvDataset(text, "multi.csv");
    expect(ds.channels[0].data).toEqual([1, 2, 3]);
  });

  it("throws when CSV has no numeric values", () => {
    const text = "a,b\nc,d\n";
    expect(() => parseCsvDataset(text, "non-numeric.csv")).toThrow(
      /No numeric values/i
    );
  });

  it("throws when CSV is empty", () => {
    expect(() => parseCsvDataset("", "empty.csv")).toThrow(/empty/i);
  });
});
