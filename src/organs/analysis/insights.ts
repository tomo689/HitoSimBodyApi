import type { MappedOutput } from '../output-mapper.js';
import type { OrganResultEntry } from '../output-mapper.js';
import type { SimulationContext } from '../types.js';
import type { WeakPoint } from './weak-points.js';
import { round } from '../utils/simulation-utils.js';

export interface InsightCausalLink {
  organ: string;
  organId: string;
  mechanism: string;
  evidenceMetric: string;
}

export interface SimulationInsight {
  headline: string;
  explanation: string;
  causalChain: InsightCausalLink[];
  references: string[];
}

export function computeInsights(
  purpose: string,
  outputs: MappedOutput[],
  organs: OrganResultEntry[],
  context: SimulationContext,
  weakPoints: WeakPoint[],
): SimulationInsight | undefined {
  const energyBalance =
    context.inputs.calorieIntake - context.inputs.calorieExpenditure;
  const exerciseMinutes = context.inputs.exerciseMinutes;

  const fatOutput = outputs.find(
    (o) =>
      o.outputId.includes('fat') ||
      o.outputId.includes('weight') ||
      o.outputName.includes('脂肪') ||
      o.outputName.includes('体重'),
  );
  const muscleOrgan = organs.find((o) => o.modelKey === 'muscle_protein_turnover');
  const adiposeOrgan = organs.find((o) => o.modelKey === 'hall_energy_balance');

  const isWeightLossGoal = /痩|減|下げ|脂肪|体重|ダイエット/.test(purpose);

  if (
    isWeightLossGoal &&
    exerciseMinutes >= 30 &&
    fatOutput?.trend === 'stable' &&
    energyBalance >= 0
  ) {
    const chain: InsightCausalLink[] = [];
    if (muscleOrgan) {
      chain.push({
        organ: muscleOrgan.organName,
        organId: muscleOrgan.organId,
        mechanism: '運動刺激による筋タンパク質合成',
        evidenceMetric: 'muscle_mass trend',
      });
    }
    if (adiposeOrgan) {
      chain.push({
        organ: adiposeOrgan.organName,
        organId: adiposeOrgan.organId,
        mechanism: 'Hall エネルギー平衡 — 摂取 > 消費',
        evidenceMetric: `energy balance +${round(energyBalance, 0)} kcal/day`,
      });
    }
    chain.push({
      organ: '代謝適応',
      organId: 'metabolic_adaptation',
      mechanism: '筋量増加に伴う基礎代謝補償',
      evidenceMetric: 'compensatory metabolism',
    });

    return {
      headline: '運動しているのに体重・体脂肪が減らない理由',
      explanation: `週 ${exerciseMinutes} 分の運動は骨格筋を刺激していますが、1日あたり約 ${round(energyBalance, 0)} kcal のエネルギー収支プラスにより脂肪組織の減少が相殺されています。筋量が増えると基礎代謝も上がり、一見「頑張っているのに結果が出ない」状態になります。`,
      causalChain: chain,
      references: ['hall_energy_balance', 'muscle_protein_turnover'],
    };
  }

  if (weakPoints.length > 0 && weakPoints[0].severity === 'high') {
    const top = weakPoints[0];
    return {
      headline: `${top.outputName} に改善の余地があります`,
      explanation: top.reason,
      causalChain: top.contributingOrganIds.map((id) => {
        const organ = organs.find((o) => o.organId === id);
        return {
          organ: organ?.organName ?? id,
          organId: id,
          mechanism: organ?.summary ?? '機能レベル低下',
          evidenceMetric: organ
            ? `functionLevel ${organ.functionLevel}/100`
            : 'unknown',
        };
      }),
      references: organs
        .filter((o) => top.contributingOrganIds.includes(o.organId))
        .map((o) => o.modelKey),
    };
  }

  return undefined;
}
