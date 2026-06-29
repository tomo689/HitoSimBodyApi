import type { HealthMetricsDto } from '../simulation/dto/simulation.dto.js';

export function healthMetricsToInputs(
  metrics?: HealthMetricsDto,
): { name: string; value: number; unit: string }[] {
  if (!metrics) return [];

  const inputs: { name: string; value: number; unit: string }[] = [];

  if (metrics.workoutMinutes != null) {
    inputs.push({
      name: '運動時間',
      value: metrics.workoutMinutes,
      unit: 'minutes',
    });
  } else if (metrics.steps != null) {
    const estimatedMinutes = Math.round(metrics.steps / 100);
    inputs.push({
      name: '運動時間',
      value: estimatedMinutes,
      unit: 'minutes',
    });
  }

  if (metrics.sleepHours != null) {
    inputs.push({
      name: '睡眠時間',
      value: metrics.sleepHours,
      unit: 'hours',
    });
  }

  if (metrics.activeEnergyKcal != null) {
    inputs.push({
      name: '消費カロリー',
      value: metrics.activeEnergyKcal,
      unit: 'kcal',
    });
  }

  if (metrics.restingHeartRate != null) {
    inputs.push({
      name: '安静時心拍',
      value: metrics.restingHeartRate,
      unit: 'bpm',
    });
  }

  if (metrics.hrvSdnn != null) {
    inputs.push({
      name: 'HRV',
      value: metrics.hrvSdnn,
      unit: 'ms',
    });
  }

  return inputs;
}

export function healthSyncToInputs(
  entries: {
    date: string;
    steps?: number;
    activeEnergyKcal?: number;
    sleepHours?: number;
    restingHeartRate?: number;
    hrvSdnn?: number;
    workoutMinutes?: number;
  }[],
): { name: string; value: number; unit: string }[] {
  if (entries.length === 0) return [];

  const avg = (values: number[]) =>
    values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : undefined;

  const steps = avg(
    entries.map((e) => e.steps).filter((v): v is number => v != null),
  );
  const activeEnergy = avg(
    entries
      .map((e) => e.activeEnergyKcal)
      .filter((v): v is number => v != null),
  );
  const sleep = avg(
    entries.map((e) => e.sleepHours).filter((v): v is number => v != null),
  );
  const rhr = avg(
    entries
      .map((e) => e.restingHeartRate)
      .filter((v): v is number => v != null),
  );
  const hrv = avg(
    entries.map((e) => e.hrvSdnn).filter((v): v is number => v != null),
  );
  const workout = avg(
    entries
      .map((e) => e.workoutMinutes)
      .filter((v): v is number => v != null),
  );

  return healthMetricsToInputs({
    steps,
    activeEnergyKcal: activeEnergy,
    sleepHours: sleep,
    restingHeartRate: rhr,
    hrvSdnn: hrv,
    workoutMinutes: workout,
  });
}
