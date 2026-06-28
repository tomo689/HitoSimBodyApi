import type { OrganModel, SimulationContext } from '../types.js';
import { clamp, round } from '../utils/simulation-utils.js';

export const heartModel: OrganModel = {
  key: 'heart',
  nameJa: '心臓',
  aliases: [
    'heart',
    'cardiovascular',
    'cardiac',
    '心臓',
    '心',
    '循環器',
  ],

  simulate(context: SimulationContext) {
    const { inputs, stepCount, labels, parameters } = context;
    const p = parameters.heart!;
    const exerciseFactor = clamp(inputs.exerciseMinutes / 60, 0, 1.5);
    const sleepFactor = clamp((inputs.sleepHours - 5) / 3, -0.3, 0.3);
    const stressFactor = inputs.stressLevel / 10;

    const R = p.vascularResistance + stressFactor * 0.15;
    const C = p.vascularCompliance - stressFactor * 0.1;
    const basalHr = p.basalHeartRate;
    const basalSv = p.basalStrokeVolume;

    const timeSeries = labels.map((label, i) => {
      const phase = i / Math.max(stepCount - 1, 1);
      const sv = basalSv * (1 + 0.25 * exerciseFactor + sleepFactor * 0.05);
      const hr =
        basalHr +
        exerciseFactor * 40 * Math.sin(Math.PI * phase) +
        stressFactor * 10;
      const q = (sv * hr) / 1000;
      return { label, value: round(q, 2) };
    });

    const avgCo =
      timeSeries.reduce((sum, pt) => sum + pt.value, 0) / timeSeries.length;
    const functionLevel = round(
      clamp(60 + exerciseFactor * 20 + sleepFactor * 10 - stressFactor * 15, 0, 100),
      0,
    );

    return {
      modelKey: 'windkessel_three_element',
      functionLevel,
      metrics: [
        { name: '平均心拍出量 CO', value: round(avgCo, 2), unit: 'L/min' },
        { name: '安静時推定 CO', value: round((basalSv * basalHr) / 1000, 2), unit: 'L/min' },
        { name: '血管抵抗 R', value: round(R, 3), unit: 'mmHg·s/mL' },
        { name: '血管コンプライアンス C', value: round(C, 3), unit: 'mL/mmHg' },
        { name: '個人化 SV', value: round(basalSv, 1), unit: 'mL' },
      ],
      timeSeries,
      summary: `Windkessel モデル（個人化 SV=${basalSv}mL, HR=${basalHr}bpm）で運動・睡眠・ストレスを反映。平均 CO ${round(avgCo, 2)} L/min。`,
    };
  },
};
