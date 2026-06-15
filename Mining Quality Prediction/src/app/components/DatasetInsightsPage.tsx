import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package, ArrowLeft, Database, TrendingUp, AlertTriangle } from "lucide-react";

interface DatasetInsights {
  row_count: number;
  column_count: number;
  date_range: { start: string; end: string };
  missing_values: Record<string, number>;
  target_statistics: Record<string, number>;
  correlation_top_pairs: Array<{ feature: string; correlation: number }>;
  feature_importance: Array<{ feature: string; importance: number }>;
  sampling_notes: string;
}

const CHART_COLORS = [
  "#b8956a", "#d4a574", "#c49b6a", "#a88960", "#9c7d56",
  "#e8c9a0", "#c9a87c", "#b09068", "#d6b088", "#bf9f74",
];

export default function DatasetInsightsPage() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<DatasetInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.datasetInsights();
        setInsights(data as DatasetInsights);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load. Start the backend API.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Loading dataset insights...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error || "No data available"}</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const correlationData = insights.correlation_top_pairs.map((p: any) => ({
    feature: (p.feature || p[0] || "").replace(/% |Flotation Column /g, "").slice(0, 18),
    correlation: Math.abs(p.correlation ?? p[1] ?? 0),
    raw: p.correlation ?? p[1] ?? 0,
  }));

  const importanceData = insights.feature_importance.map((f: any) => ({
    feature: (f.feature || f[0] || "").replace(/% |Flotation Column /g, "").slice(0, 18),
    importance: f.importance ?? f[1] ?? 0,
  }));

  const stats = insights.target_statistics;

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
          <h2 className="text-3xl font-bold mb-2">Dataset Insights</h2>
          <p className="text-muted-foreground">Flotation Plant Database — {insights.sampling_notes}</p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{insights.row_count.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{insights.column_count}</p>
              <p className="text-sm text-muted-foreground">Columns</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.mean?.toFixed(2) ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Mean % Silica</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{stats.std?.toFixed(3) ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Std Deviation</p>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Matrix */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Feature Correlation with % Silica Concentrate
            </CardTitle>
            <CardDescription>Top features most correlated with the prediction target</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={correlationData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d2f23" />
                <XAxis type="number" stroke="#a89175" domain={[0, 1]} />
                <YAxis type="category" dataKey="feature" stroke="#a89175" width={140} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#2a1f18', border: '1px solid #b8956a' }}
                  formatter={(v: number) => [v.toFixed(4), "Correlation"]}
                />
                <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                  {correlationData.map((_: any, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature Importance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" /> Feature Importance (Trained Model)
            </CardTitle>
            <CardDescription>How much each feature influences the prediction output</CardDescription>
          </CardHeader>
          <CardContent>
            {importanceData.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">No trained model found. Train a model first.</div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={importanceData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3d2f23" />
                  <XAxis type="number" stroke="#a89175" />
                  <YAxis type="category" dataKey="feature" stroke="#a89175" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2a1f18', border: '1px solid #b8956a' }}
                    formatter={(v: number) => [v.toFixed(4), "Importance"]}
                  />
                  <Bar dataKey="importance" fill="#d4a574" radius={[0, 4, 4, 0]}>
                    {importanceData.map((_: any, i: number) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Target Statistics */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Target Variable Statistics (% Silica Concentrate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats).map(([key, val]) => (
                <div key={key} className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-lg font-bold text-foreground">{typeof val === 'number' ? val.toFixed(3) : val}</p>
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>Data Coverage</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold">{insights.date_range.start}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-lg font-semibold">{insights.date_range.end}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
