import { PHYSICAL_CONSTANTS as C } from '../constants.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, integrateEuler, round } from '../utils/simulation-utils.js';

export const kidneyModel: OrganModel = {
  key: 'kidney',
  nameJa: '腎臓',
  aliases: ['kidney', 'kidneys', 'renal', '腎臓', '腎'],

  simulate(context: SimulationContext) {
    const { inputs, stepCount, labels, dtHours, parameters } = context;
    const p = parameters.kidney!;

    const gfr0 = p.baselineGfr;
    const waterInRate = inputs.waterIntakeMl / 24;
    const stressEffect = inputs.stressLevel * 0.02;

    const volumeSeries = integrateEuler(
      stepCount,
      p.baselineFluidVolume,
      (volume, step) => {
        const phase = step / stepCount;
        const map =
          C.MAP_REFERENCE + stressEffect * 20 * Math.sin(Math.PI * phase);
        const gfr =
          gfr0 *
          (1 - C.KIDNEY_PRESSURE_SENSITIVITY * (map - C.MAP_REFERENCE)) *
          (1 + C.KIDNEY_TGF_STRUCTURAL_GAIN * 0.1);
        const qIn = (waterInRate / 1000) * dtHours;
        const qOut = 0.05 * dtHours;
        return qIn - qOut - C.KIDNEY_FILTRATION_COEFF * gfr * dtHours;
      },
    );

    const gfrSeries = labels.map((label, i) => {
      const phase = i / Math.max(stepCount - 1, 1);
      const map =
        C.MAP_REFERENCE + stressEffect * 20 * Math.sin(Math.PI * phase);
      const gfr =
        gfr0 *
        (1 - C.KIDNEY_PRESSURE_SENSITIVITY * (map - C.MAP_REFERENCE)) *
        (1 + C.KIDNEY_TGF_STRUCTURAL_GAIN * 0.1);
      return { label, value: round(gfr, 1) };
    });

    const avgGfr =
      gfrSeries.reduce((s, pt) => s + pt.value, 0) / gfrSeries.length;
    const avgVolume =
      volumeSeries.reduce((s, v) => s + v, 0) / volumeSeries.length;
    const functionLevel = round(
      clamp(
        (avgGfr / gfr0) * 85 +
          (avgVolume > p.baselineFluidVolume * 0.85 &&
          avgVolume < p.baselineFluidVolume * 1.15
            ? 15
            : 0),
        0,
        100,
      ),
      0,
    );

    return {
      modelKey: 'renal_autoregulation_gfr',
      functionLevel,
      metrics: [
        { name: '推定 GFR', value: round(avgGfr, 1), unit: 'mL/min/1.73m²' },
        { name: '個人化ベースライン GFR', value: gfr0, unit: 'mL/min/1.73m²' },
        { name: '推定体液量', value: round(avgVolume, 1), unit: 'L' },
      ],
      timeSeries: gfrSeries,
      summary: `腎自己調節モデル（個人化 GFR₀=${gfr0}）で水分 ${inputs.waterIntakeMl}mL/日を反映。推定 GFR ${round(avgGfr, 1)} mL/min。`,
    };
  },
};
