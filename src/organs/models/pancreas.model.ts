import { PHYSICAL_CONSTANTS as C } from '../constants.js';
import type { CoupledStepState } from '../shared-state.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

export const pancreasModel: OrganModel = {
  key: 'pancreas',
  nameJa: '膵臓（内分泌）',
  aliases: [
    'pancreas',
    'endocrine',
    '膵臓',
    '膵',
    'インスリン',
    'insulin',
    'glucose',
  ],

  coupledStep(context, step, state) {
    const p = context.parameters.pancreas!;
    const { inputs, stepCount, dtHours } = context;
    const { shared } = state;

    const Gb = p.baselineGlucose;
    const p1 = p.glucoseEffectiveness;
    const p2 = C.BERGMAN_P2;
    const p3 = p.insulinActionRate;
    const carbRate = (inputs.carbohydrateGrams / 24) * dtHours;
    const mealPulse =
      carbRate * (1 + Math.sin((Math.PI * step) / stepCount)) * 0.5;
    const exerciseEffect =
      (inputs.exerciseMinutes / 60) * 0.01 * shared.bloodGlucose;
    const hgpContribution =
      shared.hepaticGlucoseProduction * 0.15 * dtHours;
    const muscleUptake = shared.muscleGlucoseUptake * dtHours;

    const G = shared.bloodGlucose;
    const X = shared.insulinAction;
    const dG =
      (-p1 * (G - Gb) -
        X * G +
        mealPulse +
        hgpContribution -
        exerciseEffect -
        muscleUptake) *
      dtHours;
    const insulinRelease = p3 * Math.max(0, G - Gb) * 100 * dtHours;
    const dX = (-p2 * X + insulinRelease) * dtHours;

    shared.bloodGlucose = clamp(G + dG, 60, 250);
    shared.insulinAction = Math.max(0, X + dX);
    return shared.bloodGlucose;
  },

  simulate(context, options) {
    const { inputs, stepCount, labels, dtHours, parameters } = context;
    const p = parameters.pancreas!;
    const stepValues = options?.stepValues;

    const Gb = p.baselineGlucose;
    const p1 = p.glucoseEffectiveness;
    const p2 = C.BERGMAN_P2;
    const p3 = p.insulinActionRate;
    const carbRate = (inputs.carbohydrateGrams / 24) * dtHours;

    let G = Gb;
    let X = 0;
    const glucoseSeries: number[] = [];

    if (stepValues) {
      glucoseSeries.push(...stepValues);
    } else {
      for (let i = 0; i < stepCount; i++) {
        const mealPulse =
          carbRate * (1 + Math.sin((Math.PI * i) / stepCount)) * 0.5;
        const exerciseEffect = (inputs.exerciseMinutes / 60) * 0.01 * G;
        const dG =
          (-p1 * (G - Gb) - X * G + mealPulse - exerciseEffect) * dtHours;
        const insulinRelease = p3 * Math.max(0, G - Gb) * 100 * dtHours;
        const dX = (-p2 * X + insulinRelease) * dtHours;
        G = clamp(G + dG, 60, 250);
        X = Math.max(0, X + dX);
        glucoseSeries.push(G);
      }
    }

    const timeSeries = labels.map((label, i) => ({
      label,
      value: round(glucoseSeries[i] ?? Gb, 1),
    }));

    const avgGlucose =
      glucoseSeries.reduce((s, v) => s + v, 0) / glucoseSeries.length;
    const si = 1 / (p1 + p3 * 100);
    const functionLevel = round(
      clamp(100 - Math.abs(avgGlucose - Gb) * 0.8, 0, 100),
      0,
    );

    return {
      modelKey: 'bergman_minimal',
      functionLevel,
      metrics: [
        { name: '平均血糖値 G', value: round(avgGlucose, 1), unit: 'mg/dL' },
        { name: '個人化ベースライン Gb', value: Gb, unit: 'mg/dL' },
        {
          name: 'インスリン感受性 SI',
          value: round(si, 4),
          unit: '10^-5/min/(μU/mL)',
        },
        { name: 'グルコース効率 p1', value: p1, unit: 'min^-1' },
      ],
      timeSeries,
      summary: `Bergman 最小モデル（個人化 Gb=${Gb}, p1=${p1}）で糖代謝をシミュレーション。平均血糖 ${round(avgGlucose, 1)} mg/dL。`,
    };
  },
};
