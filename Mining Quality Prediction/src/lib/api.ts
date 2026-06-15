const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = localStorage.getItem("minevision_token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export interface PredictionPayload {
  iron_feed: number;
  silica_feed: number;
  starch_flow: number;
  amina_flow: number;
  ore_pulp_flow: number;
  ore_pulp_ph: number;
  ore_pulp_density?: number;
  flotation_column_01_air_flow?: number;
  flotation_column_02_air_flow?: number;
  flotation_column_03_air_flow?: number;
  flotation_column_04_air_flow?: number;
  flotation_column_05_air_flow?: number;
  flotation_column_06_air_flow?: number;
  flotation_column_07_air_flow?: number;
  flotation_column_01_level?: number;
  flotation_column_02_level?: number;
  flotation_column_03_level?: number;
  flotation_column_04_level?: number;
  flotation_column_05_level?: number;
  flotation_column_06_level?: number;
  flotation_column_07_level?: number;
}

export const api = {
  login: (email: string, password: string, role: "employee" | "admin") =>
    request<{ access_token: string; role: string; name: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  predict: (payload: PredictionPayload) =>
    request<{
      predicted_silica_percent: number;
      risk_level: string;
      confidence_percent: number;
      horizons: Array<{
        time_step: string;
        predicted_silica_percent: number;
        confidence_percent: number;
        risk_level: string;
      }>;
      recommendations: string[];
      corrective_actions: string[];
      model_version: string;
      metrics: Record<string, number>;
    }>("/predict", { method: "POST", body: JSON.stringify(payload) }),

  train: (algorithm = "ensemble", maxRows?: number) =>
    request<{
      job_id: string;
      status: string;
      metrics: Record<string, number>;
      feature_importance: Array<{ feature: string; importance: number }>;
      logs: string[];
    }>("/train", {
      method: "POST",
      body: JSON.stringify({ algorithm, max_rows: maxRows }),
    }),

  trainingStatus: () =>
    request<{ running: boolean; last_result: unknown }>("/train/status"),

  dashboardMetrics: () =>
    request<{
      avg_silica_percent: number;
      model_accuracy_percent: number;
      model_r2: number;
      model_rmse: number;
      recent_series: Array<{ time: string; silica: number }>;
    }>("/dashboard/metrics"),

  datasetInsights: () => request<Record<string, unknown>>("/dataset/insights"),

  historicalPredictions: (limit = 48) =>
    request<{
      data: Array<{ time: string; silica: number; predicted: number }>;
      error?: string;
    }>(`/historical/predictions?limit=${limit}`),

  historicalStats: () =>
    request<{
      avg_silica: string;
      predictions_count: number;
      data_points: number;
      silica_min?: number;
      silica_max?: number;
      silica_std?: number;
    }>("/historical/stats"),

  miningSites: (status?: string) =>
    request<{
      sites: Array<{ id: string; name: string; location: string; site_type: string; status: string; flotation_columns: number; description: string; created_at: string; config: Record<string, any> }>;
      total: number; active: number; maintenance: number; offline: number;
    }>(`/mining-sites${status ? `?status=${status}` : ""}`),

  updateMiningSite: (id: string, data: Record<string, any>) =>
    request<Record<string, any>>(`/mining-sites/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  compareModels: (algorithms: string[]) =>
    request<{
      comparison: Array<{ algorithm: string; status: string; test_metrics: Record<string, number>; train_metrics: Record<string, number>; training_samples: number; validation_samples: number; feature_importance: Array<{ feature: string; importance: number }> }>;
      errors: Array<{ algorithm: string; error: string }>;
      best_algorithm: string | null;
      models_trained: number;
    }>("/model-compare", { method: "POST", body: JSON.stringify({ algorithms }) }),

  batchPredict: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("minevision_token");
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}/predict/batch`, { method: "POST", headers, body: formData })
      .then((r) => r.json());
  },

  health: () => fetch(`${API_BASE.replace("/api/v1", "")}/health`).then((r) => r.json()),
};
