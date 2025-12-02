import { useEffect, useMemo, useState } from "react";
import Plot from "react-plotly.js";

import "./App.css";
import { createPlotLayout } from "./config/plotConfig";
import { fetchDatasetById, fetchSampleDatasets } from "./api/client";
import { FILTER_TYPES, DEFAULT_FILTER_CONFIG } from "./config/constants";
import {
  applyFilter,
  buildTimeAxis,
  classifyGripVsRest,
  computeSpectrum,
} from "./utils/signalProcessing";
import {
  normalizeJsonDataset,
  parseCsvDataset,
} from "./utils/datasetIngestion";
import { createSyntheticDatasets } from "./utils/syntheticSignals";
import {
  BASE_PLOT_CONFIG,
  enableMiddleMousePan,
} from "./utils/plotInteractions";

function App() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [activeDataset, setActiveDataset] = useState(null);
  const [channelId, setChannelId] = useState("");
  const [filterConfig, setFilterConfig] = useState(DEFAULT_FILTER_CONFIG);
  const [thresholdRms, setThresholdRms] = useState(0.2);
  const [loadingDataset, setLoadingDataset] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [usingFallbackDatasets, setUsingFallbackDatasets] = useState(false);
  const [fallbackDatasets, setFallbackDatasets] = useState([]);

  useEffect(() => {
    async function bootstrap() {
      try {
        const res = await fetchSampleDatasets();
        const list = res.data.datasets || [];
        setDatasets(list);
        setBackendStatus("Connected");
        setUsingFallbackDatasets(false);
        if (list.length > 0) {
          setSelectedDatasetId(list[0].id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        const synthetic = createSyntheticDatasets();
        setFallbackDatasets(synthetic);
        setDatasets(synthetic);
        setUsingFallbackDatasets(true);
        setBackendStatus(
          "Backend unavailable – using local synthetic datasets"
        );
        if (synthetic.length > 0) {
          setSelectedDatasetId(synthetic[0].id);
          setActiveDataset(synthetic[0]);
          if (synthetic[0].channels && synthetic[0].channels[0]) {
            setChannelId(synthetic[0].channels[0].id);
          }
        }
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedDatasetId) return;

    if (uploadedDataset && selectedDatasetId === uploadedDataset.id) {
      setActiveDataset(uploadedDataset);
      if (!channelId && uploadedDataset.channels[0]) {
        setChannelId(uploadedDataset.channels[0].id);
      }
      return;
    }

    if (usingFallbackDatasets) {
      const ds =
        fallbackDatasets.find((d) => d.id === selectedDatasetId) || null;
      setActiveDataset(ds);
      if (ds && !channelId && ds.channels && ds.channels[0]) {
        setChannelId(ds.channels[0].id);
      }
      return;
    }

    async function loadDataset() {
      setLoadingDataset(true);
      setLoadError(null);
      try {
        const res = await fetchDatasetById(selectedDatasetId);
        const ds = res.data;
        setActiveDataset(ds);
        if (!channelId && ds.channels && ds.channels[0]) {
          setChannelId(ds.channels[0].id);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        setLoadError("Failed to load dataset");
      } finally {
        setLoadingDataset(false);
      }
    }

    loadDataset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasetId, usingFallbackDatasets, fallbackDatasets]);

  const currentChannel = useMemo(() => {
    if (!activeDataset || !activeDataset.channels) return null;
    return activeDataset.channels.find((ch) => ch.id === channelId) || null;
  }, [activeDataset, channelId]);

  const processed = useMemo(() => {
    if (!currentChannel || !activeDataset) {
      return {
        timeAxis: [],
        rawData: [],
        filteredData: [],
        spectrum: { freqs: [], magnitudes: [] },
        classifier: null,
      };
    }

    const rawData = currentChannel.data || [];
    const sr = activeDataset.samplingRate;
    const timeAxis = buildTimeAxis(rawData.length, sr);
    const filteredData = applyFilter(rawData, sr, filterConfig);
    const spectrum = computeSpectrum(filteredData, sr);
    const classifier = classifyGripVsRest(filteredData, sr, { thresholdRms });

    return {
      timeAxis,
      rawData,
      filteredData,
      spectrum,
      classifier,
    };
  }, [activeDataset, currentChannel, filterConfig, thresholdRms]);

  const onFilterTypeChange = (value) => {
    setFilterConfig((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const onFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadError(null);

    try {
      const text = await file.text();

      let dataset;
      if (file.name.toLowerCase().endsWith(".json")) {
        const json = JSON.parse(text);
        dataset = normalizeJsonDataset(json, file.name);
      } else {
        dataset = parseCsvDataset(text, file.name);
      }

      setUploadedDataset(dataset);
      setActiveDataset(dataset);
      setSelectedDatasetId(dataset.id);
      setUsingFallbackDatasets(false);
      if (dataset.channels[0]) {
        setChannelId(dataset.channels[0].id);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setLoadError(
        "Could not parse uploaded file. Expected JSON or simple CSV."
      );
    }
  };

  const metaInfo = activeDataset?.meta || {};
  const classifier = processed.classifier;

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Signal Lab</h1>
        <p className="app-subtitle">
          Interactive time series playground for EMG / EEG style signals. Zoom
          and pan, explore filters, inspect the spectrum and try a simple grip
          vs rest classifier. All heavy analysis runs in your browser.
        </p>
        {backendStatus && (
          <span className="meta-text">Backend status: {backendStatus}</span>
        )}
      </header>

      <div className="signal-grid">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Datasets & input</h2>
              <p className="card-subtitle">
                Use backend-hosted signals or fall back to built-in synthetic
                examples, and upload your own.
              </p>
            </div>
            {loadingDataset && (
              <span className="meta-text">Loading dataset…</span>
            )}
          </div>

          <div className="controls-group">
            <div className="control-field">
              <span className="control-label">Sample datasets</span>
              <select
                className="select"
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
              >
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} · {ds.type} · {ds.samplingRate} Hz
                    {ds.meta?.source === "synthetic-fallback" ? " · local" : ""}
                  </option>
                ))}
                {uploadedDataset && (
                  <option value={uploadedDataset.id}>
                    {uploadedDataset.name} · Uploaded
                  </option>
                )}
              </select>
              <p className="control-help">
                In production these samples are S3-backed; when the backend is
                offline we generate synthetic demos locally.
              </p>
            </div>

            <div className="control-field">
              <span className="control-label">
                Upload dataset (JSON or CSV)
              </span>
              <input
                className="file-input"
                type="file"
                accept=".json,.csv"
                onChange={onFileUpload}
              />
              <p className="control-help">
                JSON: &#123; samplingRate, channels: [&#123; data: [...] &#125;]
                &#125; or CSV with one value per row.
              </p>
            </div>

            {activeDataset && activeDataset.channels?.length > 0 && (
              <div className="control-field">
                <span className="control-label">Channel</span>
                <select
                  className="select"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                >
                  {activeDataset.channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="control-field">
              <span className="control-label">Filter</span>
              <div className="radio-row">
                {FILTER_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    className={
                      filterConfig.type === ft.value
                        ? "radio-chip active"
                        : "radio-chip"
                    }
                    onClick={() => onFilterTypeChange(ft.value)}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>
              <div
                className="control-help"
                style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}
              >
                <span>
                  Low cut:
                  <input
                    className="input"
                    style={{ width: "4rem", marginLeft: "0.25rem" }}
                    type="number"
                    value={filterConfig.lowCutHz}
                    onChange={(e) =>
                      setFilterConfig((prev) => ({
                        ...prev,
                        lowCutHz: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  Hz
                </span>
                <span>
                  High cut:
                  <input
                    className="input"
                    style={{ width: "4rem", marginLeft: "0.25rem" }}
                    type="number"
                    value={filterConfig.highCutHz}
                    onChange={(e) =>
                      setFilterConfig((prev) => ({
                        ...prev,
                        highCutHz: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  Hz
                </span>
              </div>
            </div>

            <div className="control-field">
              <span className="control-label">
                Grip vs Rest classifier threshold
              </span>
              <div className="control-help">
                RMS threshold used on a short window. Higher values require
                stronger activity to count as a grip.
              </div>
              <input
                className="input"
                type="number"
                step="0.05"
                value={thresholdRms}
                onChange={(e) => setThresholdRms(Number(e.target.value) || 0)}
              />
            </div>

            {metaInfo.description && (
              <div className="meta-text">
                <strong>Description:</strong> {metaInfo.description}
              </div>
            )}

            {loadError && <div className="error-text">{loadError}</div>}
          </div>
        </section>

        <section className="charts-grid">
          <div className="chart-container">
            <div className="chart-title-row">
              <div>
                <div className="chart-title">Time series view</div>
                <div className="chart-caption">
                  Scroll to zoom, middle-mouse to pan horizontally.
                </div>
              </div>
            </div>
            <div className="chart-inner">
              <Plot
                data={[
                  {
                    x: processed.timeAxis,
                    y: processed.filteredData,
                    type: "scatter",
                    mode: "lines",
                    line: { width: 1 },
                  },
                ]}
                layout={createPlotLayout({
                  xaxis: {
                    title: "Time (s)",
                  },
                  yaxis: {
                    title: "Amplitude",
                  },
                })}
                style={{ width: "100%", height: "100%" }}
                config={BASE_PLOT_CONFIG}
                onInitialized={(_, graphDiv) => enableMiddleMousePan(graphDiv)}
                onUpdate={(_, graphDiv) => enableMiddleMousePan(graphDiv)}
              />
            </div>
            <div className="classifier-row">
              <div>
                <span className="chart-caption">
                  Simple RMS window classifier on the filtered signal.
                </span>
                {classifier && (
                  <div className="meta-text">
                    RMS: {classifier.rms.toFixed(3)} · Threshold:{" "}
                    {classifier.threshold.toFixed(3)}
                  </div>
                )}
              </div>
              {classifier && (
                <span
                  className={
                    classifier.label === "Grip"
                      ? "badge badge-success"
                      : "badge badge-muted"
                  }
                >
                  {classifier.label}
                </span>
              )}
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-title-row">
              <div>
                <div className="chart-title">Frequency spectrum</div>
                <div className="chart-caption">
                  Magnitude spectrum of the current channel after filtering.
                  Scroll to zoom, middle-mouse to pan horizontally.
                </div>
              </div>
            </div>
            <div className="chart-inner">
              <Plot
                data={[
                  {
                    x: processed.spectrum.freqs,
                    y: processed.spectrum.magnitudes,
                    type: "scatter",
                    mode: "lines",
                    line: { width: 1 },
                  },
                ]}
                layout={createPlotLayout({
                  xaxis: {
                    title: "Frequency (Hz)",
                  },
                  yaxis: {
                    title: "Magnitude",
                  },
                })}
                style={{ width: "100%", height: "100%" }}
                config={BASE_PLOT_CONFIG}
                onInitialized={(_, graphDiv) => enableMiddleMousePan(graphDiv)}
                onUpdate={(_, graphDiv) => enableMiddleMousePan(graphDiv)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
