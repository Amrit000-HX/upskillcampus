import { motion } from "motion/react";
import { Card, CardContent } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  delay = 0
}: MetricsCardProps) {
  const trendColors = {
    up: "text-green-500",
    down: "text-destructive",
    neutral: "text-primary"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 overflow-hidden group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors`}>
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className={`text-xs px-2 py-1 rounded ${
              trend === 'up' ? 'bg-green-500/10 text-green-500' :
              trend === 'down' ? 'bg-destructive/10 text-destructive' :
              'bg-primary/10 text-primary'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {subtitle}
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm text-muted-foreground">{title}</h3>
            <p className={`text-3xl font-bold ${trendColors[trend]}`}>{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
