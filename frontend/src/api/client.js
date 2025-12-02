import axios from "axios";
import { ENV } from "../config/env";

export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
});

export function fetchSampleDatasets() {
  return apiClient.get("/api/signal/datasets");
}

export function fetchDatasetById(id) {
  return apiClient.get(`/api/signal/datasets/${id}`);
}
