import type { MappedOutput } from '../output-mapper.js';
import type { OrganResultEntry } from '../output-mapper.js';
import type { SimulationContext } from '../types.js';

export type WeakPointSeverity = 'low' | 'medium' | 'high';

export interface WeakPoint {
  outputId: string;
  outputName: string;
  severity: WeakPointSeverity;
  reason: string;
  contributingOrganIds: string[];
}

function severityFromScore(score: number): WeakPointSeverity {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function computeWeakPoints(
  outputs: MappedOutput[],
  organs: OrganResultEntry[],
  context: SimulationContext,
  purpose: string,
): WeakPoint[] {
  const weakPoints: WeakPoint[] = [];
  const organByKey = new Map(organs.map((o) => [o.organId, o]));
  const organByModelKey = new Map(
    organs.map((o) => [(o as OrganResultEntry & { modelKey: string }).modelKey ?? o.organId, o]),
  );

  for (const output of outputs) {
    const contributors: string[] = [];
    let score = 0;
    let reason = '';

    if (output.sourceOrganKey) {
      const organ =
        organByKey.get(output.sourceOrganKey) ??
        [...organs].find((o) => o.organId.includes(output.sourceOrganKey!));
      if (organ) {
        contributors.push(organ.organId);
        if (organ.functionLevel < 60) {
          score += 100 - organ.functionLevel;
          reason = `「${output.outputName}」の源臓器 ${organ.organName} の機能レベルが ${organ.functionLevel}/100 と低い。`;
        }
      }
    }

    if (output.trend === 'decreasing' && purpose.match(/痩|減|下げ|脂肪|体重/)) {
      score += 30;
      reason =
        reason ||
        `「${output.outputName}」が減少傾向。目的「${purpose}」と逆行している可能性。`;
    }

    if (output.trend === 'stable' && purpose.match(/痩|減|下げ|脂肪|体重/)) {
      const isFatRelated =
        output.outputId.includes('fat') ||
        output.outputId.includes('weight') ||
        output.outputName.includes('脂肪') ||
        output.outputName.includes('体重');
      if (isFatRelated) {
        score += 50;
        reason =
          reason ||
          `「${output.outputName}」が横ばい。運動や食事の努力が体脂肪・体重に反映されていない可能性。`;
      }
    }

    if (!output.sourceOrganKey) {
      score += 20;
      reason =
        reason ||
        `「${output.outputName}」は複合推定値のため、個別臓器モデルとの紐付けが弱い。`;
    }

    if (score >= 40) {
      weakPoints.push({
        outputId: output.outputId,
        outputName: output.outputName,
        severity: severityFromScore(score),
        reason,
        contributingOrganIds: contributors.length
          ? contributors
          : organs
              .filter((o) => o.functionLevel < 65)
              .map((o) => o.organId),
      });
    }
  }

  const energyBalance =
    context.inputs.calorieIntake - context.inputs.calorieExpenditure;
  const adipose = organByModelKey.get('adipose_tissue');
  if (
    context.inputs.exerciseMinutes >= 30 &&
    energyBalance > 100 &&
    adipose
  ) {
    weakPoints.push({
      outputId: 'energy_balance',
      outputName: 'エネルギー収支',
      severity: 'high',
      reason: `運動時間 ${context.inputs.exerciseMinutes} 分にもかかわらず、摂取カロリーが消費を ${Math.round(energyBalance)} kcal 上回っている。`,
      contributingOrganIds: [adipose.organId],
    });
  }

  for (const organ of organs) {
    if (organ.functionLevel < 50) {
      const exists = weakPoints.some((w) =>
        w.contributingOrganIds.includes(organ.organId),
      );
      if (!exists) {
        weakPoints.push({
          outputId: organ.organId,
          outputName: organ.organName,
          severity: severityFromScore(100 - organ.functionLevel),
          reason: `${organ.organName} の機能レベルが ${organ.functionLevel}/100。${organ.summary}`,
          contributingOrganIds: [organ.organId],
        });
      }
    }
  }

  return weakPoints
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 8);
}
