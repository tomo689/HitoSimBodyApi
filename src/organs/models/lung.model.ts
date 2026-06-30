import { PHYSICAL_CONSTANTS as C } from '../constants.js';
import type { CoupledStepState } from '../shared-state.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

function computeVo2(
  context: SimulationContext,
  step: number,
  state: CoupledStepState,
): number {
  const p = context.parameters.lung!;
  const { inputs, stepCount } = context;
  const exerciseFactor = clamp(inputs.exerciseMinutes / 60, 0, 1.5);
  const sleepFactor = clamp(inputs.sleepHours / 8, 0.5, 1.2);
  const phase = step / Math.max(stepCount - 1, 1);

  const rr =
    p.basalRespiratoryRate + exerciseFactor * 25 * Math.sin(Math.PI * phase);
  const vt =
    p.basalTidalVolume + exerciseFactor * 1.5 * Math.sin(Math.PI * phase);
  const ve = rr * vt * sleepFactor;
  const vo2 =
    ve * 0.05 * (1 + exerciseFactor) * (p.vo2MaxEstimate / 40);

  state.shared.vo2 = vo2;
  state.shared.oxygenDelivery =
    state.shared.cardiacOutput * vo2 * 10;
  return vo2;
}

export const lungModel: OrganModel = {
  key: 'lung',
  nameJa: '肺',
  aliases: ['lung', 'lungs', 'respiratory', '肺', '呼吸器'],

  coupledStep(context, step, state) {
    return computeVo2(context, step, state);
  },

  simulate(context, options) {
    const { inputs, stepCount, labels, parameters } = context;
    const p = parameters.lung!;
    const exerciseFactor = clamp(inputs.exerciseMinutes / 60, 0, 1.5);
    const sleepFactor = clamp(inputs.sleepHours / 8, 0.5, 1.2);
    const stepValues = options?.stepValues;

    const timeSeries = labels.map((label, i) => {
      const value =
        stepValues?.[i] ??
        (() => {
          const phase = i / Math.max(stepCount - 1, 1);
          const rr =
            p.basalRespiratoryRate +
            exerciseFactor * 25 * Math.sin(Math.PI * phase);
          const vt =
            p.basalTidalVolume +
            exerciseFactor * 1.5 * Math.sin(Math.PI * phase);
          const ve = rr * vt * sleepFactor;
          return ve * 0.05 * (1 + exerciseFactor) * (p.vo2MaxEstimate / 40);
        })();
      return { label, value: round(value, 2) };
    });

    const avgVo2 =
      timeSeries.reduce((s, pt) => s + pt.value, 0) / timeSeries.length;
    const veRest = p.basalRespiratoryRate * p.basalTidalVolume;
    const functionLevel = round(
      clamp(55 + exerciseFactor * 25 + (sleepFactor - 1) * 15, 0, 100),
      0,
    );

    return {
      modelKey: 'alveolar_gas_exchange',
      functionLevel,
      metrics: [
        { name: '安静時分時換気量 VE', value: round(veRest, 2), unit: 'L/min' },
        { name: '平均酸素摂取量 VO2', value: round(avgVo2, 2), unit: 'L/min' },
        {
          name: '推定 VO2max',
          value: round(p.vo2MaxEstimate, 1),
          unit: 'mL/kg/min',
        },
        {
          name: '推定 PAO2',
          value: round(
            C.FIO2 * (C.PATM - C.PH2O) -
              C.PACO2_REFERENCE / C.RESPIRATORY_QUOTIENT,
            1,
          ),
          unit: 'mmHg',
        },
      ],
      timeSeries,
      summary: `肺胞気方程式（個人化 RR=${p.basalRespiratoryRate}, VT=${p.basalTidalVolume}L, VO2max=${p.vo2MaxEstimate}）で VO2 平均 ${round(avgVo2, 2)} L/min。`,
    };
  },
};
