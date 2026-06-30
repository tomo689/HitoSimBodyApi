import { PHYSICAL_CONSTANTS as C } from '../constants.js';
import type { CoupledStepState } from '../shared-state.js';
import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

export const adiposeTissueModel: OrganModel = {
  key: 'adipose_tissue',
  nameJa: '脂肪組織',
  aliases: [
    'adipose_tissue',
    'adipose',
    'fat',
    'fat_tissue',
    '脂肪組織',
    '脂肪',
    '体脂肪',
  ],

  coupledStep(context, step, state) {
    const p = context.parameters.adipose_tissue!;
    const { inputs, stepCount, dtHours } = context;
    const { internal } = state;

    const daysPerStep = dtHours / 24;
    const intakeBase = inputs.calorieIntake || p.baselineCalorieIntake;
    const expenditureBase =
      inputs.calorieExpenditure || p.baselineCalorieExpenditure;
    const phase = step / stepCount;
    const intake =
      intakeBase + Math.sin(Math.PI * phase) * intakeBase * 0.05;
    const expenditure =
      expenditureBase +
      inputs.exerciseMinutes * 8 * Math.sin(Math.PI * phase);
    const deltaKcal = (intake - expenditure) * daysPerStep;
    internal.fatMass += deltaKcal / C.RHO_FAT_KCAL_PER_KG;
    return internal.fatMass;
  },

  simulate(context, options) {
    const { inputs, stepCount, labels, dtHours, parameters } = context;
    const p = parameters.adipose_tissue!;
    const stepValues = options?.stepValues;

    let fatSeries: number[];
    if (stepValues) {
      fatSeries = stepValues;
    } else {
      const daysPerStep = dtHours / 24;
      const intakeBase = inputs.calorieIntake || p.baselineCalorieIntake;
      const expenditureBase =
        inputs.calorieExpenditure || p.baselineCalorieExpenditure;

      fatSeries = [p.initialFatMass];
      let fat = p.initialFatMass;
      for (let i = 1; i < stepCount; i++) {
        const phase = i / stepCount;
        const intake =
          intakeBase + Math.sin(Math.PI * phase) * intakeBase * 0.05;
        const expenditure =
          expenditureBase +
          inputs.exerciseMinutes * 8 * Math.sin(Math.PI * phase);
        const deltaKcal = (intake - expenditure) * daysPerStep;
        fat += deltaKcal / C.RHO_FAT_KCAL_PER_KG;
        fatSeries.push(fat);
      }
    }

    const timeSeries = labels.map((label, i) => ({
      label,
      value: round(fatSeries[i] ?? p.initialFatMass, 2),
    }));

    const avgFat =
      fatSeries.reduce((s, v) => s + v, 0) / fatSeries.length;
    const intakeBase = inputs.calorieIntake || p.baselineCalorieIntake;
    const expenditureBase =
      inputs.calorieExpenditure || p.baselineCalorieExpenditure;
    const energyBalance = intakeBase - expenditureBase;
    const functionLevel = round(
      clamp(
        75 -
          Math.abs(energyBalance) / 50 -
          Math.abs(avgFat - p.initialFatMass) * 2,
        0,
        100,
      ),
      0,
    );

    return {
      modelKey: 'hall_energy_balance',
      functionLevel,
      metrics: [
        { name: '推定体脂肪量', value: round(avgFat, 2), unit: 'kg' },
        {
          name: '個人化初期体脂肪',
          value: round(p.initialFatMass, 2),
          unit: 'kg',
        },
        {
          name: 'エネルギー平衡',
          value: round(energyBalance, 0),
          unit: 'kcal/day',
        },
        {
          name: '正味脂肪変化',
          value: round((fatSeries.at(-1) ?? 0) - p.initialFatMass, 3),
          unit: 'kg',
        },
      ],
      timeSeries,
      summary: `Hall エネルギー平衡モデル（個人化体脂肪=${p.initialFatMass}kg）で推定体脂肪 ${round(avgFat, 2)} kg。`,
    };
  },
};
