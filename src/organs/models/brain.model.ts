import { PHYSICAL_CONSTANTS as C } from '../constants.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

export const brainModel: OrganModel = {
  key: 'brain',
  nameJa: '脳',
  aliases: ['brain', 'cerebral', 'cns', '脳', '中枢神経'],

  simulate(context: SimulationContext) {
    const { inputs, stepCount, labels, parameters } = context;
    const p = parameters.brain!;

    const sleepFactor = clamp(inputs.sleepHours / 8, 0.5, 1.2);
    const stressFactor = inputs.stressLevel / 10;
    const exerciseFactor = inputs.exerciseMinutes / 60;

    const timeSeries = labels.map((label, i) => {
      const phase = i / Math.max(stepCount - 1, 1);
      const neuralActivity =
        1 +
        stressFactor * 0.3 * Math.sin(Math.PI * phase) +
        exerciseFactor * 0.15 * Math.sin(Math.PI * phase);
      const map =
        C.MAP_REFERENCE + exerciseFactor * 15 * Math.sin(Math.PI * phase);
      const cbf = p.baselineCbf + p.neurovascularCoupling * (map - C.MAP_REFERENCE);
      const glucoseFactor = 1 + (inputs.carbohydrateGrams - 250) / 1000;
      const cmro2 =
        p.baselineCmro2 *
        sleepFactor *
        neuralActivity *
        glucoseFactor *
        (cbf / p.baselineCbf);
      return { label, value: round(cmro2, 2) };
    });

    const avgCmro2 =
      timeSeries.reduce((s, pt) => s + pt.value, 0) / timeSeries.length;
    const functionLevel = round(
      clamp(
        70 + sleepFactor * 15 - stressFactor * 20 + exerciseFactor * 5,
        0,
        100,
      ),
      0,
    );

    return {
      modelKey: 'cerebral_metabolic_rate',
      functionLevel,
      metrics: [
        { name: '平均 CMRO2', value: round(avgCmro2, 2), unit: 'mL O2/100g/min' },
        { name: '個人化ベースライン CMRO2', value: p.baselineCmro2, unit: 'mL O2/100g/min' },
        { name: '推定 CBF', value: round(p.baselineCbf, 1), unit: 'mL/100g/min' },
      ],
      timeSeries,
      summary: `脳代謝モデル（個人化 CMRO2₀=${p.baselineCmro2}）で平均 CMRO2 ${round(avgCmro2, 2)} mL/100g/min。`,
    };
  },
};
