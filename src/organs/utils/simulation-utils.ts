import type { Timescale } from '../../common/types.js';
import type { NormalizedInputs } from '../types.js';
import { DEFAULT_INPUTS } from '../types.js';

const TIMESCALE_CONFIG: Record<
  Timescale,
  { count: number; label: string; dtHours: number }
> = {
  hourly: { count: 24, label: '時間', dtHours: 1 },
  daily: { count: 7, label: '日', dtHours: 24 },
  weekly: { count: 4, label: '週', dtHours: 24 * 7 },
  monthly: { count: 6, label: '月', dtHours: 24 * 30 },
};

export function getTimescaleConfig(timescale: Timescale): {
  count: number;
  label: string;
  dtHours: number;
  labels: string[];
} {
  const config = TIMESCALE_CONFIG[timescale];
  const labels = Array.from({ length: config.count }, (_, i) => {
    if (timescale === 'hourly') {
      return `${String(i).padStart(2, '0')}:00`;
    }
    return `${i + 1}${config.label}目`;
  });
  return { ...config, labels };
}

const INPUT_ALIASES: Record<keyof NormalizedInputs, string[]> = {
  exerciseMinutes: [
    '運動',
    '運動時間',
    'exercise',
    'exercise_minutes',
    'workout',
  ],
  sleepHours: ['睡眠', '睡眠時間', 'sleep', 'sleep_hours'],
  proteinGrams: ['タンパク質', 'タンパク質摂取', 'protein', 'protein_g'],
  calorieIntake: [
    '摂取カロリー',
    'カロリー摂取',
    'calorie_intake',
    'calories_in',
    'energy_intake',
  ],
  calorieExpenditure: [
    '消費カロリー',
    'カロリー消費',
    'calorie_expenditure',
    'calories_out',
    'energy_expenditure',
  ],
  waterIntakeMl: ['水分', '水分摂取', 'water', 'water_intake'],
  stressLevel: ['ストレス', 'stress', 'stress_level'],
  restingHeartRate: [
    '安静時心拍',
    '心拍数',
    'heart_rate',
    'resting_heart_rate',
    'hr',
  ],
  carbohydrateGrams: [
    '炭水化物',
    '糖質',
    'carbohydrate',
    'carbs',
    'carbohydrate_g',
  ],
  fatGrams: ['脂質', '脂肪', 'fat', 'fat_g'],
};

function matchInputKey(name: string): keyof NormalizedInputs | undefined {
  const normalized = name.toLowerCase().replace(/\s+/g, '');
  for (const [key, aliases] of Object.entries(INPUT_ALIASES)) {
    if (
      aliases.some(
        (alias) =>
          normalized.includes(alias.toLowerCase().replace(/\s+/g, '')) ||
          alias.toLowerCase().replace(/\s+/g, '') === normalized,
      )
    ) {
      return key as keyof NormalizedInputs;
    }
  }
  return undefined;
}

export function normalizeInputs(
  rawInputs: { name: string; value: number; unit: string }[],
  profile?: { restingHeartRate?: number },
): NormalizedInputs {
  const result = { ...DEFAULT_INPUTS };

  if (profile?.restingHeartRate) {
    result.restingHeartRate = profile.restingHeartRate;
  }

  for (const input of rawInputs) {
    const key = matchInputKey(input.name);
    if (key) {
      result[key] = input.value;
    }
  }

  if (result.calorieExpenditure === DEFAULT_INPUTS.calorieExpenditure) {
    result.calorieExpenditure =
      1600 + result.exerciseMinutes * 8 + (8 - result.sleepHours) * 20;
  }

  return result;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function computeTrend(
  series: number[],
): 'increasing' | 'decreasing' | 'stable' {
  if (series.length < 2) {
    return 'stable';
  }
  const first = series.slice(0, Math.ceil(series.length / 3));
  const last = series.slice(-Math.ceil(series.length / 3));
  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
  const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
  const delta = (avgLast - avgFirst) / Math.max(Math.abs(avgFirst), 1e-6);

  if (delta > 0.02) return 'increasing';
  if (delta < -0.02) return 'decreasing';
  return 'stable';
}

export function integrateEuler(
  steps: number,
  initial: number,
  derivative: (value: number, step: number) => number,
): number[] {
  const series = [initial];
  let current = initial;
  for (let i = 1; i < steps; i++) {
    current += derivative(current, i);
    series.push(current);
  }
  return series;
}
