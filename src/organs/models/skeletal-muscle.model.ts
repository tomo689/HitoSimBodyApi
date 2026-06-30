import type { CoupledStepState } from '../shared-state.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

export const skeletalMuscleModel: OrganModel = {
  key: 'skeletal_muscle',
  nameJa: '骨格筋',
  aliases: [
    'skeletal_muscle',
    'muscle',
    'muscles',
    '骨格筋',
    '筋肉',
    '筋',
  ],

  coupledStep(context, step, state) {
    const p = context.parameters.skeletal_muscle!;
    const { inputs, dtHours } = context;
    const { shared, internal } = state;

    const exerciseFactor = inputs.exerciseMinutes / 60;
    const proteinFactor = inputs.proteinGrams / 60;
    const mEq = p.muscleMass;
    const ks = p.proteinSynthesisRate;
    const kd = p.proteinDegradationRate;

    const targetMass =
      mEq * (1 + 0.08 * exerciseFactor + 0.05 * proteinFactor);
    const synthesis = ks * Math.max(0, targetMass - internal.muscleMass) * dtHours;
    const degradation =
      kd * Math.max(0, internal.muscleMass - mEq * 0.95) * dtHours;
    internal.muscleMass += synthesis - degradation;

    shared.muscleGlucoseUptake =
      exerciseFactor * 0.5 +
      proteinFactor * 0.1 +
      (shared.bloodGlucose > (context.parameters.pancreas?.baselineGlucose ?? 90)
        ? 0.1
        : 0);
    return internal.muscleMass;
  },

  simulate(context, options) {
    const { inputs, stepCount, labels, dtHours, parameters } = context;
    const p = parameters.skeletal_muscle!;
    const mEq = p.muscleMass;
    const stepValues = options?.stepValues;

    let massSeries: number[];
    if (stepValues) {
      massSeries = stepValues;
    } else {
      const ks = p.proteinSynthesisRate;
      const kd = p.proteinDegradationRate;
      const exerciseFactor = inputs.exerciseMinutes / 60;
      const proteinFactor = inputs.proteinGrams / 60;
      const targetMass =
        mEq * (1 + 0.08 * exerciseFactor + 0.05 * proteinFactor);

      massSeries = [mEq];
      let current = mEq;
      for (let i = 1; i < stepCount; i++) {
        const synthesis =
          ks * Math.max(0, targetMass - current) * dtHours;
        const degradation =
          kd * Math.max(0, current - mEq * 0.95) * dtHours;
        current += synthesis - degradation;
        massSeries.push(current);
      }
    }

    const timeSeries = labels.map((label, i) => ({
      label,
      value: round(massSeries[i] ?? mEq, 2),
    }));

    const avgMass =
      massSeries.reduce((s, v) => s + v, 0) / massSeries.length;
    const netBalance = (massSeries.at(-1) ?? mEq) - (massSeries[0] ?? mEq);
    const exerciseFactor = inputs.exerciseMinutes / 60;
    const proteinFactor = inputs.proteinGrams / 60;
    const functionLevel = round(
      clamp(
        50 +
          (avgMass - mEq) * 5 +
          exerciseFactor * 20 +
          proteinFactor * 10,
        0,
        100,
      ),
      0,
    );

    return {
      modelKey: 'muscle_protein_turnover',
      functionLevel,
      metrics: [
        { name: '推定筋肉量', value: round(avgMass, 2), unit: 'kg' },
        { name: '個人化初期筋量', value: round(mEq, 2), unit: 'kg' },
        { name: 'タンパク質合成率 ks', value: p.proteinSynthesisRate, unit: 'day^-1' },
        {
          name: '正味タンパク質平衡',
          value: round(netBalance, 3),
          unit: 'kg',
        },
      ],
      timeSeries,
      summary: `タンパク質動態モデル（個人化筋量=${mEq}kg）で運動・タンパク質摂取を反映。推定筋量 ${round(avgMass, 2)} kg。`,
    };
  },
};
