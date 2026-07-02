import type { OrganResultEntry } from '../output-mapper.js';

export interface BloodState {
  functionLevel: number;
  metrics: { name: string; value: number; unit: string }[];
  timeSeries: { label: string; value: number }[];
  summary: string;
}

export function mapBloodStateFromOrgan(
  organEntries: OrganResultEntry[],
): BloodState {
  const blood = organEntries.find(
    (o) =>
      o.modelKey === 'blood_gas_transport' ||
      o.organId === 'blood' ||
      o.organName === '血液',
  );

  if (blood) {
    return {
      functionLevel: blood.functionLevel,
      metrics: blood.metrics,
      timeSeries: blood.timeSeries,
      summary: blood.summary,
    };
  }

  return {
    functionLevel: 0,
    metrics: [],
    timeSeries: [],
    summary: '血液モデルの結果がありません。',
  };
}
