import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Download, Database, Calendar, FileText } from "lucide-react";

export default function DatasetInfo() {
  const datasetUrl = "https://drive.google.com/file/d/1N80d8eTDAf1JMQXGQbHDAUaMGRyA8QG3/view?usp=sharing";

  return (
    <Card className="bg-gradient-to-br from-card to-muted/30 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-6 h-6 text-primary" />
          Mining Process Dataset
        </CardTitle>
        <CardDescription>
          Real industrial data from a flotation plant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Time Period</p>
              <p className="text-xs text-muted-foreground">March - September 2017</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
            <FileText className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Format</p>
              <p className="text-xs text-muted-foreground">CSV with 22 columns</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
            <Database className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Sampling Rate</p>
              <p className="text-xs text-muted-foreground">20s to hourly</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold mb-3">Dataset Columns:</h4>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Date & Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">% Iron Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">% Silica Feed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Starch Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Amina Flow</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Ore Pulp Flow & pH</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Flotation Column Levels (1-7)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Air Flow Rates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-accent font-semibold">% Iron Concentrate (Lab)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span className="text-accent font-semibold">% Silica Concentrate (Target)</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="w-full"
            onClick={() => window.open(datasetUrl, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Dataset
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Dataset hosted on Google Drive
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
