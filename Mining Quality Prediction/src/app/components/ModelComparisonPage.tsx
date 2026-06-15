import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Package, ArrowLeft, FlaskConical, Trophy, Loader2 } from "lucide-react";

interface ModelResult {
  algorithm: string;
  status: string;
  test_metrics: Record<string, number>;
  train_metrics: Record<string, number>;
  training_samples: number;
  validation_samples: number;
  feature_importance: Array<{ feature: string; importance: number }>;
}

interface CompareResponse {
  comparison: ModelResult[];
  errors: Array<{ algorithm: string; error: string }>;
  best_algorithm: string | null;
  models_trained: number;
}

const ALGO_COLORS: Record<string, string> = {
  random_forest: "#4ade80",
  xgboost: "#60a5fa",
  lightgbm: "#f472b6",
  ensemble: "#b8956a",
  neural_network: "#a78bfa",
};

const ALGO_LABELS: Record<string, string> = {
  random_forest: "Random Forest",
  xgboost: "XGBoost",
  lightgbm: "LightGBM",
  ensemble: "Ensemble (Voting)",
  neural_network: "Neural Network",
};

export default function ModelComparisonPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>([
    "random_forest", "xgboost", "lightgbm", "ensemble",
  ]);

  const allAlgos = ["random_forest", "xgboost", "lightgbm", "neural_network", "ensemble"];

  const toggleAlgo = (algo: string) => {
    setSelectedAlgos((prev) =>
      prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo]
    );
  };

  const runComparison = async () => {
    if (selectedAlgos.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.compareModels(selectedAlgos);
      setResults(data as CompareResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed. Start the backend API.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = results?.comparison.map((r) => ({
    algorithm: ALGO_LABELS[r.algorithm] || r.algorithm,
    R2: parseFloat((r.test_metrics.r2 * 100).toFixed(1)),
    Accuracy: r.test_metrics.accuracy_percent,
    RMSE: r.test_metrics.rmse,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">MinePredict AI</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Model Comparison</h2>
          <p className="text-muted-foreground">Train and compare multiple algorithms side-by-side</p>
        </div>

        {/* Algorithm Selection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5" /> Select Algorithms
            </CardTitle>
            <CardDescription>Choose at least 2 algorithms to compare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {allAlgos.map((algo) => (
                <button
                  key={algo}
                  onClick={() => toggleAlgo(algo)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedAlgos.includes(algo)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {ALGO_LABELS[algo]}
                </button>
              ))}
            </div>
            <Button
              onClick={runComparison}
              disabled={loading || selectedAlgos.length < 2}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Training {selectedAlgos.length} models...</>
              ) : (
                `Run Comparison (${selectedAlgos.length} models)`
              )}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <>
            {/* Winner */}
            {results.best_algorithm && (
              <Card className="bg-card border-primary/30">
                <CardContent className="pt-6 flex items-center gap-4">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-lg font-bold">
                      Best Model: {ALGO_LABELS[results.best_algorithm] || results.best_algorithm}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Trained {results.models_trained} models — ranked by test R²
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* R² & Accuracy Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Test set R² (%) and Accuracy across algorithms</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d2f23" />
                    <XAxis dataKey="algorithm" stroke="#a89175" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#a89175" />
                    <Tooltip contentStyle={{ backgroundColor: '#2a1f18', border: '1px solid #b8956a' }} />
                    <Legend />
                    <Bar dataKey="R2" fill="#b8956a" name="R² (%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Accuracy" fill="#d4a574" name="Accuracy %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground">Algorithm</th>
                        <th className="text-right py-3 px-4 text-muted-foreground">Test R²</th>
                        <th className="text-right py-3 px-4 text-muted-foreground">Test RMSE</th>
                        <th className="text-right py-3 px-4 text-muted-foreground">Test MAE</th>
                        <th className="text-right py-3 px-4 text-muted-foreground">Train R²</th>
                        <th className="text-right py-3 px-4 text-muted-foreground">Samples</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.comparison.map((r, i) => (
                        <tr key={r.algorithm} className={`border-b border-border/50 ${i === 0 ? 'bg-primary/5' : ''}`}>
                          <td className="py-3 px-4 font-medium">
                            {i === 0 && <Trophy className="w-4 h-4 inline mr-1 text-yellow-500" />}
                            {ALGO_LABELS[r.algorithm] || r.algorithm}
                          </td>
                          <td className="text-right py-3 px-4 font-mono">{r.test_metrics.r2?.toFixed(4)}</td>
                          <td className="text-right py-3 px-4 font-mono">{r.test_metrics.rmse?.toFixed(4)}</td>
                          <td className="text-right py-3 px-4 font-mono">{r.test_metrics.mae?.toFixed(4)}</td>
                          <td className="text-right py-3 px-4 font-mono">{r.train_metrics.r2?.toFixed(4)}</td>
                          <td className="text-right py-3 px-4">{r.training_samples + r.validation_samples}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Errors */}
            {results.errors.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader><CardTitle className="text-destructive">Training Errors</CardTitle></CardHeader>
                <CardContent>
                  {results.errors.map((e) => (
                    <p key={e.algorithm} className="text-sm text-destructive">{e.algorithm}: {e.error}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
