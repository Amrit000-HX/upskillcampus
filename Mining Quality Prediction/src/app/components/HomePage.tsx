import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Package, Droplet, TrendingUp, Database, Settings, Activity, MapPin, FlaskConical, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ParticleBackground from "./ParticleBackground";
import ProcessFlow from "./ProcessFlow";
import Footer from "./Footer";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">MinePredict AI</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="ghost" onClick={() => navigate('/dataset-insights')}>
              Dataset Insights
            </Button>
            <Button variant="ghost" onClick={() => navigate('/mining-sites')}>
              Mining Sites
            </Button>
            <Button variant="ghost" onClick={() => navigate('/model-comparison')}>
              Model Comparison
            </Button>
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        </header>

        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-6 text-foreground">
              Quality Prediction in Mining Process
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Predict silica impurity levels in iron ore concentrate using advanced machine learning.
              Help engineers take proactive actions to optimize flotation plant efficiency and reduce environmental impact.
            </p>
            <Button size="lg" className="mr-4" onClick={() => navigate('/dashboard')}>
              Start Predicting
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <ProcessFlow />
        </section>

        <section className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">About the Model</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Real-time Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Predict % Silica Concentrate every minute, enabling engineers to act proactively
                  and optimize the flotation process in real-time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Multi-step Forecasting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Forecast silica levels hours ahead, giving engineers advance warning
                  to implement corrective actions and prevent quality degradation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-primary" />
                  Flotation Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Analyze ore quality measures, flotation column levels, and air flow data
                  to minimize impurity and reduce waste tailings.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer" onClick={() => navigate('/dataset-insights')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Dataset Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Explore correlations, feature importance, and statistical analysis
                  of the flotation plant dataset to understand key quality drivers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer" onClick={() => navigate('/mining-sites')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Mining Sites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage and monitor operational mining zones, track site status,
                  and configure flotation parameters across the facility.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer" onClick={() => navigate('/model-comparison')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-primary" />
                  Model Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Train and compare Random Forest, XGBoost, LightGBM, and ensemble
                  models side-by-side to find the best prediction algorithm.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h3 className="text-3xl font-bold text-center mb-12">Key Model Inputs</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-card border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Ore Quality Measures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Iron ore pulp quality before flotation</li>
                  <li>• % Iron Feed measurements</li>
                  <li>• % Silica Feed measurements</li>
                  <li>• Starch Flow and reagent levels</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20 cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Process Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Flotation column levels (1-7)</li>
                  <li>• Air flow rates in columns</li>
                  <li>• Amina Flow reagent control</li>
                  <li>• Ore Pulp Flow and pH levels</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 mb-16">
          <Card className="bg-card border-border max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Model Details</CardTitle>
              <CardDescription>Understanding the Mining Process Dataset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-primary">Context</h4>
                <p className="text-muted-foreground">
                  This dataset comes from a real flotation plant, one of the most important parts of a mining process.
                  The flotation process concentrates iron ore by removing impurities, particularly silica.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">Dataset Overview</h4>
                <p className="text-muted-foreground mb-2">
                  Data collected from March 2017 to September 2017 with varying sampling rates:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Some variables sampled every 20 seconds</li>
                  <li>Others sampled hourly</li>
                  <li>22 columns of process and quality data</li>
                  <li>Target: % Silica in Iron Ore Concentrate (final column)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-primary">Goals</h4>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Predict % Silica Concentrate every minute for real-time monitoring</li>
                  <li>Multi-step ahead prediction (hours in advance)</li>
                  <li>Enable predictive and optimized engineering actions</li>
                  <li>Reduce iron waste going to tailings</li>
                  <li>Minimize environmental impact</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <Footer />
      </div>
    </div>
  );
}
