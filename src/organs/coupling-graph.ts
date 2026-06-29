import type { OrganResultEntry } from './output-mapper.js';
import type { SimulationContext } from './types.js';
import { clamp, round } from './utils/simulation-utils.js';

/**
 * 臓器間カップリング v1 — 並列シミュレーション後に相互影響を反映
 */
export function applyOrganCoupling(
  organResults: Map<string, OrganResultEntry>,
  context: SimulationContext,
): void {
  const muscle = organResults.get('skeletal_muscle');
  const adipose = organResults.get('adipose_tissue');
  const pancreas = organResults.get('pancreas');
  const liver = organResults.get('liver');
  const heart = organResults.get('heart');
  const kidney = organResults.get('kidney');

  if (muscle && adipose) {
    const muscleGain =
      (muscle.timeSeries.at(-1)?.value ?? 0) -
      (muscle.timeSeries[0]?.value ?? 0);
    const fatDelta =
      (adipose.timeSeries.at(-1)?.value ?? 0) -
      (adipose.timeSeries[0]?.value ?? 0);

    if (
      context.inputs.exerciseMinutes >= 30 &&
      muscleGain > 0 &&
      fatDelta >= -0.1
    ) {
      const compensation = round(muscleGain * 0.15, 2);
      adipose.metrics = [
        ...adipose.metrics.filter((m) => m.name !== '筋量補償代謝'),
        {
          name: '筋量補償代謝',
          value: compensation,
          unit: 'kcal/day',
        },
      ];
      adipose.summary = `${adipose.summary} 筋量増加（+${round(muscleGain, 2)}）による基礎代謝補償を反映。`;
      adipose.functionLevel = round(
        clamp(adipose.functionLevel - compensation / 10, 0, 100),
        0,
      );
    }
  }

  if (pancreas && liver) {
    const avgGlucose =
      pancreas.timeSeries.reduce((s, p) => s + p.value, 0) /
      Math.max(pancreas.timeSeries.length, 1);
    const baseline = context.parameters.pancreas?.baselineGlucose ?? 90;
    const glucoseExcess = Math.max(0, avgGlucose - baseline);

    if (glucoseExcess > 5) {
      liver.metrics = liver.metrics.map((m) =>
        m.name.includes('HGP') || m.name.includes('肝糖')
          ? { ...m, value: round(m.value * (1 + glucoseExcess / 200), 2) }
          : m,
      );
      liver.summary = `${liver.summary} 膵臓由来の血糖上昇（平均 ${round(avgGlucose, 1)} mg/dL）に連動した肝糖新生を反映。`;
    }
  }

  if (heart && kidney) {
    const mapMetric = heart.metrics.find(
      (m) => m.name.includes('MAP') || m.name.includes('血圧'),
    );
    if (mapMetric && mapMetric.value > 95) {
      kidney.functionLevel = round(
        clamp(kidney.functionLevel - (mapMetric.value - 95) * 0.5, 0, 100),
        0,
      );
      kidney.summary = `${kidney.summary} 心臓由来の血圧上昇（MAP ${mapMetric.value} mmHg）が腎血流に影響。`;
    }
  }
}
