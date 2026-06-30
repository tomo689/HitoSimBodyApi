import type { CoupledStepState } from '../shared-state.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

export const liverModel: OrganModel = {
  key: 'liver',
  nameJa: '肝臓',
  aliases: ['liver', 'hepatic', '肝臓', '肝'],

  coupledStep(context, step, state) {
    const p = context.parameters.liver!;
    const { inputs, stepCount, dtHours } = context;
    const { shared, internal } = state;

    const exerciseFactor = inputs.exerciseMinutes / 60;
    const phase = step / Math.max(stepCount - 1, 1);
    const insulinSuppression =
      p.insulinSuppressionCoeff * shared.insulinAction * 2;
    const hgp = Math.max(
      0,
      p.hepaticGlucoseProductionBasal -
        p.exerciseSuppressionCoeff *
          exerciseFactor *
          10 *
          Math.sin(Math.PI * phase) -
        insulinSuppression,
    );

    const glucoseIntakeRate = (inputs.carbohydrateGrams * 4) / 24;
    const intake = (glucoseIntakeRate / 24) * dtHours;
    const utilization = (inputs.calorieExpenditure / 2000) * 0.5 * dtHours;
    internal.glycogen += intake - hgp * 0.1 * dtHours - utilization * 0.05;

    shared.hepaticGlucoseProduction = hgp;
    return hgp;
  },

  simulate(context, options) {
    const { inputs, stepCount, labels, parameters } = context;
    const p = parameters.liver!;
    const exerciseFactor = inputs.exerciseMinutes / 60;
    const stepValues = options?.stepValues;

    const hgpValues =
      stepValues ??
      labels.map((_, i) => {
        const phase = i / Math.max(stepCount - 1, 1);
        return (
          p.hepaticGlucoseProductionBasal -
          p.exerciseSuppressionCoeff *
            exerciseFactor *
            10 *
            Math.sin(Math.PI * phase)
        );
      });

    const timeSeries = labels.map((label, i) => ({
      label,
      value: round(hgpValues[i] ?? p.hepaticGlucoseProductionBasal, 2),
    }));

    const avgHgp =
      hgpValues.reduce((s, v) => s + v, 0) / hgpValues.length;
    const functionLevel = round(
      clamp(
        70 - Math.abs(avgHgp - p.hepaticGlucoseProductionBasal) * 2,
        0,
        100,
      ),
      0,
    );

    return {
      modelKey: 'hepatic_glucose_production',
      functionLevel,
      metrics: [
        {
          name: '平均肝糖新生 HGP',
          value: round(avgHgp, 2),
          unit: 'μmol/kg/min',
        },
        {
          name: '個人化ベースライン HGP',
          value: p.hepaticGlucoseProductionBasal,
          unit: 'μmol/kg/min',
        },
        {
          name: '推定肝グリコーゲン量',
          value: round(p.glycogenStore, 1),
          unit: 'g',
        },
      ],
      timeSeries,
      summary: `肝糖新生モデル（個人化 HGP₀=${p.hepaticGlucoseProductionBasal}）で平均 HGP ${round(avgHgp, 2)} μmol/kg/min。インスリンによる抑制を反映。`,
    };
  },
};
