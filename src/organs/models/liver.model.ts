import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, integrateEuler, round } from '../utils/simulation-utils.js';

export const liverModel: OrganModel = {
  key: 'liver',
  nameJa: '肝臓',
  aliases: ['liver', 'hepatic', '肝臓', '肝'],

  simulate(context: SimulationContext) {
    const { inputs, stepCount, labels, dtHours, parameters } = context;
    const p = parameters.liver!;

    const exerciseFactor = inputs.exerciseMinutes / 60;
    const glucoseIntakeRate = (inputs.carbohydrateGrams * 4) / 24;

    const glycogenSeries = integrateEuler(
      stepCount,
      p.glycogenStore,
      (glycogen, step) => {
        const phase = step / stepCount;
        const hgp =
          p.hepaticGlucoseProductionBasal -
          p.exerciseSuppressionCoeff * exerciseFactor * 10 * Math.sin(Math.PI * phase) +
          p.insulinSuppressionCoeff * 2;
        const intake = (glucoseIntakeRate / 24) * dtHours;
        const utilization =
          (inputs.calorieExpenditure / 2000) * 0.5 * dtHours;
        return intake - hgp * 0.1 * dtHours - utilization * 0.05;
      },
    );

    const hgpValues = labels.map((_, i) => {
      const phase = i / Math.max(stepCount - 1, 1);
      return (
        p.hepaticGlucoseProductionBasal -
        p.exerciseSuppressionCoeff * exerciseFactor * 10 * Math.sin(Math.PI * phase)
      );
    });

    const timeSeries = labels.map((label, i) => ({
      label,
      value: round(hgpValues[i] ?? p.hepaticGlucoseProductionBasal, 2),
    }));

    const avgHgp =
      hgpValues.reduce((s, v) => s + v, 0) / hgpValues.length;
    const avgGlycogen =
      glycogenSeries.reduce((s, v) => s + v, 0) / glycogenSeries.length;
    const functionLevel = round(
      clamp(
        70 +
          (avgGlycogen - p.glycogenStore * 0.8) * 0.3 -
          Math.abs(avgHgp - p.hepaticGlucoseProductionBasal) * 2,
        0,
        100,
      ),
      0,
    );

    return {
      modelKey: 'hepatic_glucose_production',
      functionLevel,
      metrics: [
        { name: '平均肝糖新生 HGP', value: round(avgHgp, 2), unit: 'μmol/kg/min' },
        { name: '個人化ベースライン HGP', value: p.hepaticGlucoseProductionBasal, unit: 'μmol/kg/min' },
        { name: '推定肝グリコーゲン量', value: round(avgGlycogen, 1), unit: 'g' },
      ],
      timeSeries,
      summary: `肝糖新生モデル（個人化 HGP₀=${p.hepaticGlucoseProductionBasal}）で平均 HGP ${round(avgHgp, 2)} μmol/kg/min。`,
    };
  },
};
