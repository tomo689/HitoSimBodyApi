export interface OutputMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
}

export interface Organ {
  id: string;
  name: string;
  role: string;
}

export interface SimulationDataPoint {
  label: string;
  value: number;
}

export interface OutputSimulationResult {
  outputId: string;
  outputName: string;
  unit: string;
  dataPoints: SimulationDataPoint[];
  summary: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface OrganSimulationResult {
  organId: string;
  organName: string;
  functionLevel: number;
  metrics: { name: string; value: number; unit: string }[];
  summary: string;
}

export interface Recommendation {
  title: string;
  description: string;
  expectedImpact: string;
  targetOutputs: string[];
  priority: number;
}

export type Timescale = 'hourly' | 'daily' | 'weekly' | 'monthly';
