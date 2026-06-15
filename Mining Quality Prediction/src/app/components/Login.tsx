import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Package, User, Lock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("employee@minevision.ai");
  const [password, setPassword] = useState("employee123");
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(email, password, role);
      localStorage.setItem("minevision_token", res.access_token);
      localStorage.setItem("minevision_user", JSON.stringify({ name: res.name, role: res.role }));
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials. Try employee@minevision.ai / employee123");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold text-primary">MineVision AI</h1>
          </div>
          <p className="text-muted-foreground">Industrial login — employee & admin roles</p>
        </div>

        <Card className="bg-card/90 border-border backdrop-blur">
          <CardHeader>
            <CardTitle>Secure Login</CardTitle>
            <CardDescription>JWT authentication via mining prediction API</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-input-background"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={role === "employee" ? "default" : "outline"}
                    onClick={() => setRole("employee")}
                  >
                    Employee
                  </Button>
                  <Button
                    type="button"
                    variant={role === "admin" ? "default" : "outline"}
                    onClick={() => setRole("admin")}
                  >
                    Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-input-background"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <Button type="button" variant="link" className="w-full" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          Demo: employee@minevision.ai / employee123 — admin@minevision.ai / admin123
        </p>
      </div>
    </div>
  );
}
