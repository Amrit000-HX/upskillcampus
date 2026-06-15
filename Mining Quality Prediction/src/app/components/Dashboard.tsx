import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Play, TrendingUp, AlertCircle, CheckCircle, Package, Target, Zap, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as VirtualList } from "react-window";
import DatasetUploader from "./DatasetUploader";
import DatasetInfo from "./DatasetInfo";
import MetricsCard from "./MetricsCard";

export default function Dashboard() {
  const navigate = useNavigate();
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [predictionMeta, setPredictionMeta] = useState<{
    risk?: string;
    recommendations?: string[];
    modelVersion?: string;
    confidence?: number;
  }>({});
  const [apiError, setApiError] = useState("");
  const [modelMetrics, setModelMetrics] = useState({ accuracy: "—", rmse: "—", r2: "—" });
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  const [inputValues, setInputValues] = useState({
    ironFeed: "55.2",
    silicaFeed: "16.98",
    starchFlow: "3019",
    aminaFlow: "557",
    orePulpFlow: "395",
    orePulpPH: "10.07",
    orePulpDensity: "1.74",
    previousSilica: "1.25",
    previousIron: "65.0",
    flotationColumn1Level: "457",
    flotationColumn1AirFlow: "249"
  });

  const [historicalData, setHistoricalData] = useState<Array<{ time: string; silica: number; predicted: number }>>([]);
  const [historicalStats, setHistoricalStats] = useState<{ avg_silica: string; predictions_count: number } | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState(true);

  const trainingMetrics = [
    { epoch: 1, loss: 0.245, valLoss: 0.268 },
    { epoch: 2, loss: 0.198, valLoss: 0.215 },
    { epoch: 3, loss: 0.156, valLoss: 0.178 },
    { epoch: 4, loss: 0.123, valLoss: 0.145 },
    { epoch: 5, loss: 0.098, valLoss: 0.121 },
    { epoch: 6, loss: 0.082, valLoss: 0.105 },
    { epoch: 7, loss: 0.071, valLoss: 0.095 },
    { epoch: 8, loss: 0.063, valLoss: 0.087 }
  ];

  const loadMetrics = useCallback(async () => {
    try {
      const m = await api.dashboardMetrics();
      setModelMetrics({
        accuracy: `${m.model_accuracy_percent.toFixed(1)}%`,
        rmse: m.model_rmse.toFixed(3),
        r2: m.model_r2.toFixed(3),
      });
    } catch {
      /* API offline */
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    async function loadHistorical() {
      setHistoricalLoading(true);
      try {
        const [predData, stats] = await Promise.all([
          api.historicalPredictions(48),
          api.historicalStats(),
        ]);
        if (predData.data) setHistoricalData(predData.data);
        setHistoricalStats(stats);
      } catch {
        // API offline — keep defaults
      } finally {
        setHistoricalLoading(false);
      }
    }
    loadHistorical();
  }, []);

  const handleTrainModel = async () => {
    setIsTraining(true);
    setTrainingProgress(10);
    setTrainingLogs(["Connecting to training API..."]);
    try {
      const result = await api.train("ensemble");
      setTrainingProgress(100);
      setTrainingLogs(result.logs);
      setModelMetrics({
        accuracy: `${result.metrics.accuracy_percent?.toFixed(1) ?? "—"}%`,
        rmse: result.metrics.rmse?.toFixed(3) ?? "—",
        r2: result.metrics.r2?.toFixed(3) ?? "—",
      });
    } catch (e) {
      setTrainingLogs([`Training failed: ${e instanceof Error ? e.message : "API unavailable"}`]);
    } finally {
      setIsTraining(false);
    }
  };

  const handlePredict = async () => {
    setApiError("");
    try {
      const res = await api.predict({
        iron_feed: parseFloat(inputValues.ironFeed),
        silica_feed: parseFloat(inputValues.silicaFeed),
        starch_flow: parseFloat(inputValues.starchFlow),
        amina_flow: parseFloat(inputValues.aminaFlow),
        ore_pulp_flow: parseFloat(inputValues.orePulpFlow),
        ore_pulp_ph: parseFloat(inputValues.orePulpPH),
        ore_pulp_density: parseFloat(inputValues.orePulpDensity),
        previous_silica_concentrate: parseFloat(inputValues.previousSilica),
        previous_iron_concentrate: parseFloat(inputValues.previousIron),
        flotation_column_01_level: parseFloat(inputValues.flotationColumn1Level),
        flotation_column_01_air_flow: parseFloat(inputValues.flotationColumn1AirFlow),
      });
      setPredictions(
        res.horizons.map((h) => ({
          timeStep: h.time_step,
          value: h.predicted_silica_percent.toFixed(3),
          confidence: `${h.confidence_percent}%`,
          risk: h.risk_level,
        }))
      );
      setPredictionMeta({
        risk: res.risk_level,
        recommendations: [...res.recommendations, ...res.corrective_actions],
        modelVersion: res.model_version,
        confidence: res.confidence_percent,
      });
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Prediction API unavailable. Start backend on port 8000.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">MinePredict AI</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Mining Quality Dashboard</h2>
          <p className="text-muted-foreground">Train and deploy predictive models for flotation plant optimization</p>
        </div>

        <Tabs defaultValue="predict" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="predict">Predict</TabsTrigger>
            <TabsTrigger value="train">Train Model</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="predict" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Input Parameters</CardTitle>
                  <CardDescription>Enter current process measurements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ironFeed">% Iron Feed</Label>
                      <Input
                        id="ironFeed"
                        type="number"
                        step="0.1"
                        value={inputValues.ironFeed}
                        onChange={(e) => setInputValues({ ...inputValues, ironFeed: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="silicaFeed">% Silica Feed</Label>
                      <Input
                        id="silicaFeed"
                        type="number"
                        step="0.1"
                        value={inputValues.silicaFeed}
                        onChange={(e) => setInputValues({ ...inputValues, silicaFeed: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="starchFlow">Starch Flow</Label>
                      <Input
                        id="starchFlow"
                        type="number"
                        value={inputValues.starchFlow}
                        onChange={(e) => setInputValues({ ...inputValues, starchFlow: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aminaFlow">Amina Flow</Label>
                      <Input
                        id="aminaFlow"
                        type="number"
                        value={inputValues.aminaFlow}
                        onChange={(e) => setInputValues({ ...inputValues, aminaFlow: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orePulpFlow">Ore Pulp Flow</Label>
                      <Input
                        id="orePulpFlow"
                        type="number"
                        value={inputValues.orePulpFlow}
                        onChange={(e) => setInputValues({ ...inputValues, orePulpFlow: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orePulpDensity">Ore Pulp Density</Label>
                      <Input
                        id="orePulpDensity"
                        type="number"
                        step="0.01"
                        value={inputValues.orePulpDensity}
                        onChange={(e) => setInputValues({ ...inputValues, orePulpDensity: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousSilica">Previous Lab % Silica</Label>
                      <Input
                        id="previousSilica"
                        type="number"
                        step="0.01"
                        value={inputValues.previousSilica}
                        onChange={(e) => setInputValues({ ...inputValues, previousSilica: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousIron">Previous Lab % Iron</Label>
                      <Input
                        id="previousIron"
                        type="number"
                        step="0.1"
                        value={inputValues.previousIron}
                        onChange={(e) => setInputValues({ ...inputValues, previousIron: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orePulpPH">Ore Pulp pH</Label>
                      <Input
                        id="orePulpPH"
                        type="number"
                        step="0.1"
                        value={inputValues.orePulpPH}
                        onChange={(e) => setInputValues({ ...inputValues, orePulpPH: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flotationColumn1Level">Flotation Col. 1 Level</Label>
                      <Input
                        id="flotationColumn1Level"
                        type="number"
                        value={inputValues.flotationColumn1Level}
                        onChange={(e) => setInputValues({ ...inputValues, flotationColumn1Level: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flotationColumn1AirFlow">Flotation Col. 1 Air Flow</Label>
                      <Input
                        id="flotationColumn1AirFlow"
                        type="number"
                        value={inputValues.flotationColumn1AirFlow}
                        onChange={(e) => setInputValues({ ...inputValues, flotationColumn1AirFlow: e.target.value })}
                        className="bg-input-background"
                      />
                    </div>
                  </div>
                  {apiError && (
                    <p className="text-sm text-destructive">{apiError}</p>
                  )}
                  <Button onClick={handlePredict} className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    Generate Predictions (ML API)
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Predictions</CardTitle>
                  <CardDescription>Multi-step ahead silica concentration forecasts</CardDescription>
                </CardHeader>
                <CardContent>
                  {predictions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
                      <p>Enter parameters and click "Generate Predictions"</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {predictions.length <= 5 ? (
                      predictions.map((pred, idx) => (
                        <div key={idx} className="p-4 bg-muted rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">{pred.timeStep}</span>
                            <span className="text-xs text-primary">Confidence: {pred.confidence}</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-foreground">{pred.value}</span>
                            <span className="text-muted-foreground">% Silica</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <VirtualList
                        height={400}
                        itemCount={predictions.length}
                        itemSize={90}
                        width="100%"
                      >
                        {({ index, style }) => {
                          const pred = predictions[index];
                          return (
                            <div style={style} key={index}>
                              <div className="p-4 bg-muted rounded-lg mr-2">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm text-muted-foreground">{pred.timeStep}</span>
                                  <span className="text-xs text-primary">Confidence: {pred.confidence}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-bold text-foreground">{pred.value}</span>
                                  <span className="text-muted-foreground">% Silica</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      </VirtualList>
                    )}
                      {predictionMeta.recommendations && predictionMeta.recommendations.length > 0 && (
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                          {predictionMeta.recommendations.slice(0, 4).map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      )}
                      <div className="pt-4 border-t border-border">
                        <div className="flex items-start gap-2">
                          {parseFloat(predictions[0]?.value) < 2.5 ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                              <div>
                                <p className="font-semibold text-green-500">Quality within acceptable range</p>
                                <p className="text-sm text-muted-foreground">No immediate action required</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                              <div>
                                <p className="font-semibold text-destructive">High silica concentration detected</p>
                                <p className="text-sm text-muted-foreground">Consider adjusting reagent flow rates</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="train" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Model Training</CardTitle>
                  <CardDescription>Upload dataset and train the prediction model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DatasetUploader onFileUpload={(file) => console.log('File uploaded:', file.name)} />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">Training Configuration</h4>
                      <p className="text-sm text-muted-foreground">Epochs: 50 | Batch Size: 32 | Learning Rate: 0.001</p>
                    </div>
                    <Button onClick={handleTrainModel} disabled={isTraining}>
                      {isTraining ? "Training..." : "Start Training"}
                    </Button>
                  </div>

                  {trainingLogs.length > 0 && (
                    <div className="text-xs font-mono bg-muted p-3 rounded max-h-32 overflow-y-auto">
                      {trainingLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  )}

                  {(isTraining || trainingProgress === 100) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{trainingProgress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${trainingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {trainingProgress === 100 && (
                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trainingMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3d2f23" />
                        <XAxis dataKey="epoch" stroke="#a89175" />
                        <YAxis stroke="#a89175" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#2a1f18', border: '1px solid #b8956a' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="loss" stroke="#b8956a" name="Training Loss" />
                        <Line type="monotone" dataKey="valLoss" stroke="#d4a574" name="Validation Loss" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <DatasetInfo />
          </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <MetricsCard
                title="Avg Silica %"
                value={historicalStats?.avg_silica ?? "—"}
                subtitle="From dataset"
                icon={Target}
                trend="down"
                delay={0}
              />
              <MetricsCard
                title="Model R²"
                value={modelMetrics.r2}
                subtitle={`RMSE ${modelMetrics.rmse} | Acc ${modelMetrics.accuracy}`}
                icon={Zap}
                trend="up"
                delay={0.1}
              />
              <MetricsCard
                title="Data Points"
                value={historicalStats?.predictions_count?.toLocaleString() ?? "—"}
                subtitle="Total records"
                icon={BarChart3}
                trend="neutral"
                delay={0.2}
              />
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Historical Silica Concentration</CardTitle>
                <CardDescription>Actual vs Predicted values over time</CardDescription>
              </CardHeader>
              <CardContent>
                {historicalLoading ? (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Loading historical data...
                  </div>
                ) : historicalData.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    No historical data available. Start the backend API.
                  </div>
                ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d2f23" />
                    <XAxis dataKey="time" stroke="#a89175" />
                    <YAxis stroke="#a89175" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#2a1f18', border: '1px solid #b8956a' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="silica" stroke="#b8956a" fill="#b8956a" fillOpacity={0.3} name="Actual % Silica" />
                    <Area type="monotone" dataKey="predicted" stroke="#d4a574" fill="#d4a574" fillOpacity={0.3} name="Predicted % Silica" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
