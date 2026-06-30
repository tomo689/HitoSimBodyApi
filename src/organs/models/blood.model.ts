import type { CoupledStepState } from '../shared-state.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

function buildResult(
  context: SimulationContext,
  stepValues: number[],
  hematocritValues: number[],
  oxygenSatValues: number[],
) {
  const { labels, parameters } = context;
  const p = parameters.blood!;

  const timeSeries = labels.map((label, i) => ({
    label,
    value: round(stepValues[i] ?? p.baselineGlucose, 1),
  }));

  const avgGlucose =
    stepValues.reduce((s, v) => s + v, 0) / Math.max(stepValues.length, 1);
  const avgHct =
    hematocritValues.reduce((s, v) => s + v, 0) /
    Math.max(hematocritValues.length, 1);
  const avgSpO2 =
    oxygenSatValues.reduce((s, v) => s + v, 0) /
    Math.max(oxygenSatValues.length, 1);

  const functionLevel = round(
    clamp(
      70 +
        (avgSpO2 - 95) * 2 +
        (avgHct - p.baselineHematocrit) * 0.5 -
        Math.abs(avgGlucose - p.baselineGlucose) * 0.3,
      0,
      100,
    ),
    0,
  );

  return {
    modelKey: 'blood_gas_transport',
    functionLevel,
    metrics: [
      { name: '平均血糖値', value: round(avgGlucose, 1), unit: 'mg/dL' },
      { name: '平均ヘマトクリット', value: round(avgHct, 1), unit: '%' },
      { name: '平均 SpO2 推定', value: round(avgSpO2, 1), unit: '%' },
      { name: '血液量', value: round(p.totalBloodVolume, 1), unit: 'L' },
      { name: 'ヘモグロビン', value: round(p.baselineHemoglobin, 1), unit: 'g/dL' },
    ],
    timeSeries,
    summary: `血液ガス輸送モデル（血糖 ${round(avgGlucose, 1)} mg/dL、Hct ${round(avgHct, 1)}%、SpO2 ${round(avgSpO2, 1)}%）で全身循環・代謝状態を統合。`,
  };
}

export const bloodModel: OrganModel = {
  key: 'blood',
  nameJa: '血液',
  aliases: ['blood', '血液', '血', 'hematology', '血液循環'],

  coupledStep(context: SimulationContext, _step: number, state: CoupledStepState) {
    const p = context.parameters.blood!;
    const { shared } = state;
    const baselineVolume = context.parameters.kidney?.baselineFluidVolume ?? 40;

    const volumeRatio = shared.fluidVolume / baselineVolume;
    const hematocrit = clamp(
      p.baselineHematocrit / Math.max(volumeRatio, 0.7),
      30,
      55,
    );

    const oxygenExtraction = shared.vo2 / Math.max(shared.cardiacOutput, 0.5);
    const spo2 = clamp(
      98 - oxygenExtraction * 15 + (shared.vo2 / 0.5) * 2,
      88,
      100,
    );

    shared.hematocrit = hematocrit;
    shared.oxygenSaturation = spo2;

    return shared.bloodGlucose;
  },

  simulate(context, options) {
    const p = context.parameters.blood!;
    const stepValues = options?.stepValues;
    const history = options?.sharedStateHistory;

    if (stepValues && history) {
      return buildResult(
        context,
        stepValues,
        history.map((h) => h.hematocrit),
        history.map((h) => h.oxygenSaturation),
      );
    }

    const { labels } = context;
    const glucose = p.baselineGlucose;
    const values = labels.map(() => glucose);
    const hct = labels.map(() => p.baselineHematocrit);
    const spo2 = labels.map(() => 97);
    return buildResult(context, values, hct, spo2);
  },
};
