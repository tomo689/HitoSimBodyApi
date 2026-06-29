import type { OrganModelResult, SimulationContext } from './types.js';
import { computeTrend, round } from './utils/simulation-utils.js';

const OUTPUT_SOURCE_MAP: Record<
  string,
  { organKey: string; metricName?: string; useTimeSeries?: boolean }
> = {
  muscle_mass: { organKey: 'skeletal_muscle', useTimeSeries: true },
  muscle: { organKey: 'skeletal_muscle', useTimeSeries: true },
  strength: { organKey: 'skeletal_muscle', useTimeSeries: true },
  body_fat: { organKey: 'adipose_tissue', useTimeSeries: true },
  fat_mass: { organKey: 'adipose_tissue', useTimeSeries: true },
  body_fat_percentage: { organKey: 'adipose_tissue', useTimeSeries: true },
  blood_glucose: { organKey: 'pancreas', useTimeSeries: true },
  glucose: { organKey: 'pancreas', useTimeSeries: true },
  insulin_sensitivity: { organKey: 'pancreas', metricName: 'インスリン感受性 SI' },
  vo2max: { organKey: 'lung', useTimeSeries: true },
  vo2: { organKey: 'lung', useTimeSeries: true },
  endurance: { organKey: 'lung', useTimeSeries: true },
  cardiac_output: { organKey: 'heart', useTimeSeries: true },
  heart_rate: { organKey: 'heart', useTimeSeries: true },
  cardiovascular_fitness: { organKey: 'heart', useTimeSeries: true },
  gfr: { organKey: 'kidney', useTimeSeries: true },
  kidney_function: { organKey: 'kidney', useTimeSeries: true },
  hydration: { organKey: 'kidney', metricName: '推定体液量' },
  liver_function: { organKey: 'liver', useTimeSeries: true },
  hgp: { organKey: 'liver', useTimeSeries: true },
  cognitive_performance: { organKey: 'brain', useTimeSeries: true },
  mental_clarity: { organKey: 'brain', useTimeSeries: true },
  energy_level: { organKey: 'brain', useTimeSeries: true },
  weight: { organKey: 'adipose_tissue', useTimeSeries: true },
  hematocrit: { organKey: 'blood', metricName: 'ヘマトクリット' },
  hemoglobin: { organKey: 'blood', metricName: 'ヘモグロビン' },
  spo2: { organKey: 'blood', metricName: 'SpO2' },
  oxygen_saturation: { organKey: 'blood', metricName: 'SpO2' },
  blood_health: { organKey: 'blood', useTimeSeries: true },
  circulation: { organKey: 'blood', useTimeSeries: true },
};

function findSource(outputId: string, outputName: string) {
  const id = outputId.toLowerCase();
  if (OUTPUT_SOURCE_MAP[id]) return OUTPUT_SOURCE_MAP[id];

  for (const [key, source] of Object.entries(OUTPUT_SOURCE_MAP)) {
    if (id.includes(key) || outputName.toLowerCase().includes(key)) {
      return source;
    }
  }
  return undefined;
}

export type OrganResultEntry = OrganModelResult & {
  organId: string;
  organName: string;
  isDefaultOrgan?: boolean;
};

export interface MappedOutput {
  outputId: string;
  outputName: string;
  unit: string;
  dataPoints: { label: string; value: number }[];
  summary: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  sourceOrganKey?: string;
  modelKey?: string;
}

export function mapOutputsFromOrgans(
  outputs: { id: string; name: string; unit: string }[],
  organResults: Map<string, OrganResultEntry>,
  context: SimulationContext,
): MappedOutput[] {
  return outputs.map((output) => {
    const source = findSource(output.id, output.name);

    if (source) {
      const result = organResults.get(source.organKey);
      if (result) {
        if (source.useTimeSeries) {
          const values = result.timeSeries.map((p) => p.value);
          return {
            outputId: output.id,
            outputName: output.name,
            unit: output.unit,
            dataPoints: result.timeSeries.map((p) => ({
              label: p.label,
              value: round(p.value, 2),
            })),
            summary: `${result.summary} → アウトプット「${output.name}」への換算。`,
            trend: computeTrend(values),
            sourceOrganKey: source.organKey,
            modelKey: result.modelKey,
          };
        }

        if (source.metricName) {
          const metric = result.metrics.find((m) =>
            m.name.includes(source.metricName!),
          );
          if (metric) {
            return {
              outputId: output.id,
              outputName: output.name,
              unit: output.unit,
              dataPoints: context.labels.map((label) => ({
                label,
                value: round(metric.value, 2),
              })),
              summary: `${metric.name}: ${metric.value} ${metric.unit}`,
              trend: 'stable',
              sourceOrganKey: source.organKey,
              modelKey: result.modelKey,
            };
          }
        }
      }
    }

    const allSeries = [...new Set(organResults.values())];
    const avgFunction =
      allSeries.reduce((s, r) => s + r.functionLevel, 0) /
      Math.max(allSeries.length, 1);
    const composite = context.labels.map((label, i) => {
      const val =
        allSeries.reduce((s, r) => s + (r.timeSeries[i]?.value ?? 0), 0) /
        Math.max(allSeries.length, 1);
      return { label, value: round(val, 2) };
    });

    return {
      outputId: output.id,
      outputName: output.name,
      unit: output.unit,
      dataPoints: composite,
      summary: `関連臓器モデルの複合指標（平均機能レベル ${round(avgFunction, 0)}/100）から「${output.name}」を推定。`,
      trend: computeTrend(composite.map((p) => p.value)),
    };
  });
}
