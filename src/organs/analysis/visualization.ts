import type { OrganResultEntry } from '../output-mapper.js';

export type OrganVisualizationStatus = 'healthy' | 'strained' | 'critical';

export interface OrganVisualization {
  status: OrganVisualizationStatus;
  primaryMetric: string;
  bottleneckScore: number;
}

function statusFromLevel(level: number): OrganVisualizationStatus {
  if (level >= 70) return 'healthy';
  if (level >= 45) return 'strained';
  return 'critical';
}

export function buildOrganVisualization(
  organ: OrganResultEntry,
): OrganVisualization {
  const primaryMetric =
    organ.metrics[0]?.name ?? `${organ.organName} 機能レベル`;
  const bottleneckScore = Math.round(100 - organ.functionLevel);

  return {
    status: statusFromLevel(organ.functionLevel),
    primaryMetric,
    bottleneckScore,
  };
}
