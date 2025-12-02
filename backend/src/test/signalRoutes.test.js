import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../app";
import { SAMPLE_DATASETS } from "../sample-data/sampleDatasets.js";

describe("Health endpoint", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: "ok",
        message: "Backend is alive",
      })
    );
  });
});

describe("Signal datasets API", () => {
  it("lists sample datasets with summaries", async () => {
    const res = await request(app).get("/api/signal/datasets");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("datasets");

    const { datasets } = res.body;
    expect(Array.isArray(datasets)).toBe(true);
    expect(datasets.length).toBe(SAMPLE_DATASETS.length);

    const firstSummary = datasets[0];
    expect(firstSummary).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        type: expect.any(String),
        samplingRate: expect.any(Number),
        channelCount: expect.any(Number),
        length: expect.any(Number),
        meta: expect.any(Object),
      })
    );

    const sample0 = SAMPLE_DATASETS[0];
    expect(firstSummary.channelCount).toBe(sample0.channels.length);
    expect(firstSummary.length).toBe(sample0.channels[0].data.length);
  });

  it("fetches a full dataset by id", async () => {
    const sample = SAMPLE_DATASETS[0];
    const res = await request(app).get(`/api/signal/datasets/${sample.id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: sample.id,
        samplingRate: sample.samplingRate,
      })
    );
    expect(Array.isArray(res.body.channels)).toBe(true);
    expect(res.body.channels[0].data.length).toBeGreaterThan(0);
  });

  it("returns 404 when dataset is not found", async () => {
    const res = await request(app).get("/api/signal/datasets/nonexistent_id");

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "Dataset not found",
      })
    );
  });
});

describe("Error handling", () => {
  it("returns JSON 500 for unexpected errors", async () => {
    const res = await request(app).get("/test/error");

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual(
      expect.objectContaining({
        error: "InternalServerError",
        message: expect.any(String),
      })
    );
  });
});
