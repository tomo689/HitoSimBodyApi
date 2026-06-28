/** ユーザープロファイル（シミュレーション時の個人属性） */
export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  bodyFatPercent?: number;
  restingHeartRate?: number;
  /** その他の属性（既往歴、服薬、生活習慣など） */
  additionalData?: { key: string; value: string | number }[];
}

export interface HeartParameters {
  basalStrokeVolume: number;
  basalHeartRate: number;
  vascularResistance: number;
  vascularCompliance: number;
}

export interface LungParameters {
  basalRespiratoryRate: number;
  basalTidalVolume: number;
  vo2MaxEstimate: number;
}

export interface PancreasParameters {
  baselineGlucose: number;
  baselineInsulin: number;
  glucoseEffectiveness: number;
  insulinSensitivity: number;
  insulinActionRate: number;
}

export interface LiverParameters {
  hepaticGlucoseProductionBasal: number;
  exerciseSuppressionCoeff: number;
  insulinSuppressionCoeff: number;
  glycogenStore: number;
}

export interface KidneyParameters {
  baselineGfr: number;
  baselineFluidVolume: number;
}

export interface SkeletalMuscleParameters {
  muscleMass: number;
  proteinSynthesisRate: number;
  proteinDegradationRate: number;
}

export interface BrainParameters {
  baselineCmro2: number;
  baselineCbf: number;
  neurovascularCoupling: number;
}

export interface AdiposeTissueParameters {
  initialFatMass: number;
  baselineCalorieIntake: number;
  baselineCalorieExpenditure: number;
}

/** 臓器ごとの個人化パラメータ */
export interface OrganParametersMap {
  heart?: HeartParameters;
  lung?: LungParameters;
  pancreas?: PancreasParameters;
  liver?: LiverParameters;
  kidney?: KidneyParameters;
  skeletal_muscle?: SkeletalMuscleParameters;
  brain?: BrainParameters;
  adipose_tissue?: AdiposeTissueParameters;
}

export type OrganParameterKey = keyof OrganParametersMap;
