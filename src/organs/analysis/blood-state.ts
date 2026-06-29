import type { OrganResultEntry } from '../output-mapper.js';
import { clamp, round } from '../utils/simulation-utils.js';

export interface BloodState {
  functionLevel: number;
  metrics: { name: string; value: number; unit: string }[];
  timeSeries: { label: string; value: number }[];
  summary: string;
}

export function deriveBloodState(
  organResults: OrganResultEntry[],
  labels: string[],
): BloodState {
  const pancreas = organResults.find((o) => o.modelKey === 'bergman_minimal');
  const kidney = organResults.find((o) => o.modelKey === 'renal_autoregulation_gfr');
  const adipose = organResults.find((o) => o.modelKey === 'hall_energy_balance');
  const heart = organResults.find((o) => o.modelKey === 'windkessel_three_element');

  const glucoseMetric = pancreas?.metrics.find((m) =>
    m.name.includes('血糖') || m.name.includes('glucose'),
  );
  const avgGlucose =
    glucoseMetric?.value ??
    (pancreas
      ? pancreas.timeSeries.reduce((s, p) => s + p.value, 0) /
        Math.max(pancreas.timeSeries.length, 1)
      : 90);

  const hydrationMetric = kidney?.metrics.find((m) =>
    m.name.includes('体液') || m.name.includes('水分'),
  );
  const hydration = hydrationMetric?.value ?? 55;

  const lipidProxy = adipose
    ? (adipose.timeSeries.at(-1)?.value ?? 0) -
      (adipose.timeSeries[0]?.value ?? 0)
    : 0;

  const mapMetric = heart?.metrics.find((m) =>
    m.name.includes('MAP') || m.name.includes('血圧'),
  );
  const map = mapMetric?.value ?? 90;

  const metrics = [
    { name: '血糖', value: round(avgGlucose, 1), unit: 'mg/dL' },
    { name: '推定水分バランス', value: round(hydration, 1), unit: '%' },
    { name: '脂質動態 proxy', value: round(lipidProxy, 2), unit: 'kg delta' },
    { name: '循環負荷 (MAP)', value: round(map, 0), unit: 'mmHg' },
  ];

  const compositeSeries = labels.map((label, i) => {
    const glucose = pancreas?.timeSeries[i]?.value ?? avgGlucose;
    const normalized =
      (glucose / 120) * 40 +
      (hydration / 70) * 30 +
      (clamp(map, 60, 120) / 120) * 30;
    return { label, value: round(normalized, 1) };
  });

  const functionLevel = round(
    clamp(
      100 -
        Math.abs(avgGlucose - 90) * 0.5 -
        Math.abs(hydration - 55) * 0.3 -
        Math.max(0, map - 100) * 0.4,
      0,
      100,
    ),
    0,
  );

  return {
    functionLevel,
    metrics,
    timeSeries: compositeSeries,
    summary: `血液状態の複合推定: 血糖 ${round(avgGlucose, 1)} mg/dL、循環 MAP ${round(map, 0)} mmHg。`,
  };
}
