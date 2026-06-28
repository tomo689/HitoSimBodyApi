import type { Timescale } from '../common/types.js';
import type {
  OrganParametersMap,
  UserProfile,
} from './parameters/types.js';

/** ユーザー入力を正規化したシミュレーション入力 */
export interface NormalizedInputs {
  exerciseMinutes: number;
  sleepHours: number;
  proteinGrams: number;
  calorieIntake: number;
  calorieExpenditure: number;
  waterIntakeMl: number;
  stressLevel: number;
  restingHeartRate: number;
  carbohydrateGrams: number;
  fatGrams: number;
}

/** 臓器シミュレーションの実行コンテキスト */
export interface SimulationContext {
  timescale: Timescale;
  stepCount: number;
  labels: string[];
  /** 1 ステップあたりの時間（時間単位） */
  dtHours: number;
  inputs: NormalizedInputs;
  userProfile: UserProfile;
  /** AI / プロファイルから決定された個人化パラメータ */
  parameters: OrganParametersMap;
}

/** 臓器モデルの出力 */
export interface OrganModelResult {
  modelKey: string;
  functionLevel: number;
  metrics: { name: string; value: number; unit: string }[];
  timeSeries: { label: string; value: number }[];
  summary: string;
}

/** 臓器モデルインターフェース */
export interface OrganModel {
  readonly key: string;
  readonly nameJa: string;
  readonly aliases: string[];
  simulate(context: SimulationContext): OrganModelResult;
}

export const DEFAULT_INPUTS: NormalizedInputs = {
  exerciseMinutes: 30,
  sleepHours: 7,
  proteinGrams: 60,
  calorieIntake: 2000,
  calorieExpenditure: 2000,
  waterIntakeMl: 2000,
  stressLevel: 3,
  restingHeartRate: 70,
  carbohydrateGrams: 250,
  fatGrams: 65,
};
