import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { Package, ArrowLeft, MapPin, Settings, CheckCircle, AlertTriangle, WrenchIcon, Power } from "lucide-react";

interface MiningSite {
  id: string;
  name: string;
  location: string;
  site_type: string;
  status: string;
  flotation_columns: number;
  description: string;
  created_at: string;
  config: Record<string, any>;
}

interface SitesResponse {
  sites: MiningSite[];
  total: number;
  active: number;
  maintenance: number;
  offline: number;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  active: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  maintenance: { icon: WrenchIcon, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  offline: { icon: Power, color: "text-red-500", bg: "bg-red-500/10" },
};

const TYPE_LABELS: Record<string, string> = {
  flotation: "Flotation Plant",
  grinding: "Grinding Circuit",
  crushing: "Crushing Plant",
};

export default function MiningSitesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<SitesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await api.miningSites();
        setData(result as SitesResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load. Start the backend API.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleStatusToggle = async (site: MiningSite) => {
    const newStatus = site.status === "active" ? "maintenance" : "active";
    try {
      await api.updateMiningSite(site.id, { status: newStatus });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          sites: prev.sites.map((s) => s.id === site.id ? { ...s, status: newStatus } : s),
          active: prev.sites.filter((s) => (s.id === site.id ? newStatus : s.status) === "active").length,
          maintenance: prev.sites.filter((s) => (s.id === site.id ? newStatus : s.status) === "maintenance").length,
        };
      });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Loading mining sites...</p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold mb-2">Mining Sites</h2>
          <p className="text-muted-foreground">Manage and monitor operational zones across the mining facility</p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertTriangle className="text-destructive" />
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{data.total}</p>
                <p className="text-sm text-muted-foreground">Total Sites</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-500">{data.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-yellow-500">{data.maintenance}</p>
                <p className="text-sm text-muted-foreground">Maintenance</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-500">{data.offline}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sites Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {data?.sites.map((site) => {
            const statusCfg = STATUS_CONFIG[site.status] || STATUS_CONFIG.offline;
            const StatusIcon = statusCfg.icon;
            const isExpanded = selectedSite === site.id;

            return (
              <Card
                key={site.id}
                className={`bg-card border-border cursor-pointer transition-all hover:border-primary/50 ${
                  isExpanded ? "ring-1 ring-primary/30" : ""
                }`}
                onClick={() => setSelectedSite(isExpanded ? null : site.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{site.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {site.location}
                      </CardDescription>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground">
                      {TYPE_LABELS[site.site_type] || site.site_type}
                    </span>
                    {site.flotation_columns > 0 && (
                      <span className="text-muted-foreground">
                        {site.flotation_columns} flotation columns
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{site.description}</p>

                  {isExpanded && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-1">
                        <Settings className="w-4 h-4" /> Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(site.config).map(([key, val]) => (
                          <div key={key} className="p-2 bg-muted rounded text-xs">
                            <span className="text-muted-foreground">{key}: </span>
                            <span className="font-medium">{JSON.stringify(val)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant={site.status === "active" ? "outline" : "default"}
                          onClick={(e) => { e.stopPropagation(); handleStatusToggle(site); }}
                        >
                          {site.status === "active" ? "Set Maintenance" : "Set Active"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
