import { motion } from "motion/react";
import { Package, Droplet, Activity, TrendingUp } from "lucide-react";

export default function ProcessFlow() {
  return (
    <div className="py-16 bg-muted/30 rounded-lg">
      <h3 className="text-3xl font-bold text-center mb-12">Flotation Process Flow</h3>

      <div className="flex items-center justify-center gap-8 px-8 flex-wrap">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-primary">
            <Package className="w-12 h-12 text-primary" />
          </div>
          <h4 className="font-semibold mb-2">Iron Ore Input</h4>
          <p className="text-sm text-muted-foreground max-w-[150px]">
            Raw ore pulp enters flotation plant
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-primary text-4xl"
        >
          →
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-primary">
            <Droplet className="w-12 h-12 text-primary" />
          </div>
          <h4 className="font-semibold mb-2">Reagent Addition</h4>
          <p className="text-sm text-muted-foreground max-w-[150px]">
            Starch and amina flow control
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="text-primary text-4xl"
        >
          →
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-primary">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <h4 className="font-semibold mb-2">Flotation Columns</h4>
          <p className="text-sm text-muted-foreground max-w-[150px]">
            7 columns with air flow separation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="text-primary text-4xl"
        >
          →
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-4 mx-auto border-2 border-accent">
            <TrendingUp className="w-12 h-12 text-accent" />
          </div>
          <h4 className="font-semibold mb-2">Quality Prediction</h4>
          <p className="text-sm text-muted-foreground max-w-[150px]">
            AI predicts % silica concentration
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="mt-12 text-center"
      >
        <div className="inline-block bg-accent/20 rounded-lg px-6 py-3 border border-accent">
          <p className="text-sm">
            <span className="font-semibold text-accent">Goal:</span> Minimize silica impurity and reduce environmental waste
          </p>
        </div>
      </motion.div>
    </div>
  );
}
