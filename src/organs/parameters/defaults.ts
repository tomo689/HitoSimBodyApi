import type {
  AdiposeTissueParameters,
  BrainParameters,
  HeartParameters,
  KidneyParameters,
  LiverParameters,
  LungParameters,
  OrganParameterKey,
  OrganParametersMap,
  PancreasParameters,
  SkeletalMuscleParameters,
  UserProfile,
} from './types.js';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function genderFactor(gender: UserProfile['gender']): number {
  if (gender === 'male') return 1.0;
  if (gender === 'female') return 0.92;
  return 0.96;
}

function estimateWeight(profile: UserProfile): number {
  if (profile.weightKg) return profile.weightKg;
  const h = (profile.heightCm ?? 170) / 100;
  return 22 * h * h * genderFactor(profile.gender);
}

function estimateBodyFat(profile: UserProfile): number {
  if (profile.bodyFatPercent) return profile.bodyFatPercent;
  const age = profile.age;
  if (profile.gender === 'male') return clamp(10 + age * 0.2, 8, 35);
  if (profile.gender === 'female') return clamp(18 + age * 0.25, 15, 42);
  return 20;
}

/** 年齢・性別・体格から決定論的に算出するフォールバックパラメータ */
export function buildDefaultParameters(
  profile: UserProfile,
  organKeys: OrganParameterKey[],
): OrganParametersMap {
  const weight = estimateWeight(profile);
  const bodyFat = estimateBodyFat(profile);
  const age = profile.age;
  const gf = genderFactor(profile.gender);
  const hr =
    profile.restingHeartRate ?? clamp(220 - age * 0.7 * gf, 50, 100);

  const params: OrganParametersMap = {};

  for (const key of organKeys) {
    switch (key) {
      case 'heart':
        params.heart = {
          basalStrokeVolume: clamp(65 * gf + (weight / 70) * 5, 50, 90),
          basalHeartRate: hr,
          vascularResistance: clamp(1.0 + (age - 30) * 0.005, 0.8, 1.4),
          vascularCompliance: clamp(1.2 - (age - 30) * 0.004, 0.8, 1.3),
        };
        break;
      case 'lung':
        params.lung = {
          basalRespiratoryRate: clamp(15 - (age - 40) * 0.02, 12, 18),
          basalTidalVolume: clamp(0.45 + (weight / 100) * 0.15, 0.35, 0.7),
          vo2MaxEstimate: clamp(
            (profile.gender === 'female' ? 35 : 42) - (age - 25) * 0.35,
            20,
            60,
          ),
        };
        break;
      case 'pancreas': {
        const gb = clamp(90 + (age - 40) * 0.3, 75, 110);
        params.pancreas = {
          baselineGlucose: gb,
          baselineInsulin: clamp(8 + (gb - 90) * 0.05, 5, 15),
          glucoseEffectiveness: clamp(0.022 - (age - 30) * 0.0002, 0.01, 0.03),
          insulinSensitivity: clamp(0.0004 - (age - 30) * 0.000005, 0.0002, 0.0006),
          insulinActionRate: clamp(0.0005 - bodyFat * 0.000002, 0.0003, 0.0007),
        };
        break;
      }
      case 'liver':
        params.liver = {
          hepaticGlucoseProductionBasal: clamp(9 + (age - 40) * 0.02, 7, 12),
          exerciseSuppressionCoeff: 0.04,
          insulinSuppressionCoeff: clamp(0.02 + bodyFat * 0.0002, 0.015, 0.035),
          glycogenStore: clamp(80 + weight * 0.3, 60, 150),
        };
        break;
      case 'kidney': {
        const gfr = clamp(
          120 - (age - 25) * 0.8 * (profile.gender === 'female' ? 0.95 : 1),
          60,
          120,
        );
        params.kidney = {
          baselineGfr: gfr,
          baselineFluidVolume: clamp(weight * 0.55, 30, 50),
        };
        break;
      }
      case 'skeletal_muscle': {
        const leanMass = weight * (1 - bodyFat / 100) * 0.45;
        params.skeletal_muscle = {
          muscleMass: clamp(leanMass, 15, 50),
          proteinSynthesisRate: clamp(0.022 - age * 0.00005, 0.012, 0.028),
          proteinDegradationRate: clamp(0.018 + age * 0.00004, 0.012, 0.025),
        };
        break;
      }
      case 'brain':
        params.brain = {
          baselineCmro2: clamp(3.5 - (age - 30) * 0.008, 2.8, 4.0),
          baselineCbf: clamp(50 - (age - 30) * 0.15, 40, 55),
          neurovascularCoupling: 0.5,
        };
        break;
      case 'adipose_tissue': {
        const fatMass = weight * (bodyFat / 100);
        params.adipose_tissue = {
          initialFatMass: clamp(fatMass, 5, 60),
          baselineCalorieIntake: clamp(
            weight * 24 + (profile.gender === 'male' ? 200 : 0),
            1400,
            3500,
          ),
          baselineCalorieExpenditure: clamp(weight * 22 + age * 2, 1300, 3200),
        };
        break;
      }
    }
  }

  return params;
}

function mergePartial<T extends object>(base: T, patch: Partial<T>): T {
  const result = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && v !== null) {
      (result as Record<string, unknown>)[k] = v;
    }
  }
  return result;
}

function clampHeart(p: Partial<HeartParameters>): Partial<HeartParameters> {
  return {
    basalStrokeVolume: num(p.basalStrokeVolume, 40, 100),
    basalHeartRate: num(p.basalHeartRate, 45, 120),
    vascularResistance: num(p.vascularResistance, 0.6, 2.0),
    vascularCompliance: num(p.vascularCompliance, 0.6, 1.5),
  };
}

function clampLung(p: Partial<LungParameters>): Partial<LungParameters> {
  return {
    basalRespiratoryRate: num(p.basalRespiratoryRate, 10, 25),
    basalTidalVolume: num(p.basalTidalVolume, 0.3, 0.9),
    vo2MaxEstimate: num(p.vo2MaxEstimate, 15, 80),
  };
}

function clampPancreas(p: Partial<PancreasParameters>): Partial<PancreasParameters> {
  return {
    baselineGlucose: num(p.baselineGlucose, 70, 140),
    baselineInsulin: num(p.baselineInsulin, 3, 25),
    glucoseEffectiveness: num(p.glucoseEffectiveness, 0.005, 0.05),
    insulinSensitivity: num(p.insulinSensitivity, 0.0001, 0.001),
    insulinActionRate: num(p.insulinActionRate, 0.0001, 0.001),
  };
}

function clampLiver(p: Partial<LiverParameters>): Partial<LiverParameters> {
  return {
    hepaticGlucoseProductionBasal: num(p.hepaticGlucoseProductionBasal, 5, 15),
    exerciseSuppressionCoeff: num(p.exerciseSuppressionCoeff, 0.01, 0.08),
    insulinSuppressionCoeff: num(p.insulinSuppressionCoeff, 0.01, 0.05),
    glycogenStore: num(p.glycogenStore, 40, 200),
  };
}

function clampKidney(p: Partial<KidneyParameters>): Partial<KidneyParameters> {
  return {
    baselineGfr: num(p.baselineGfr, 30, 130),
    baselineFluidVolume: num(p.baselineFluidVolume, 25, 55),
  };
}

function clampMuscle(p: Partial<SkeletalMuscleParameters>): Partial<SkeletalMuscleParameters> {
  return {
    muscleMass: num(p.muscleMass, 10, 60),
    proteinSynthesisRate: num(p.proteinSynthesisRate, 0.008, 0.035),
    proteinDegradationRate: num(p.proteinDegradationRate, 0.008, 0.03),
  };
}

function clampBrain(p: Partial<BrainParameters>): Partial<BrainParameters> {
  return {
    baselineCmro2: num(p.baselineCmro2, 2.0, 5.0),
    baselineCbf: num(p.baselineCbf, 35, 65),
    neurovascularCoupling: num(p.neurovascularCoupling, 0.2, 0.8),
  };
}

function clampAdipose(p: Partial<AdiposeTissueParameters>): Partial<AdiposeTissueParameters> {
  return {
    initialFatMass: num(p.initialFatMass, 3, 80),
    baselineCalorieIntake: num(p.baselineCalorieIntake, 1000, 5000),
    baselineCalorieExpenditure: num(p.baselineCalorieExpenditure, 1000, 5000),
  };
}

function num(v: number | undefined, min: number, max: number): number | undefined {
  return v !== undefined ? clamp(v, min, max) : undefined;
}

/** AI 推定値をデフォルトにマージ（範囲クランプ付き） */
export function mergeParameters(
  defaults: OrganParametersMap,
  aiParams: Partial<OrganParametersMap>,
): OrganParametersMap {
  return {
    heart:
      defaults.heart && aiParams.heart
        ? mergePartial(defaults.heart, clampHeart(aiParams.heart))
        : defaults.heart,
    lung:
      defaults.lung && aiParams.lung
        ? mergePartial(defaults.lung, clampLung(aiParams.lung))
        : defaults.lung,
    pancreas:
      defaults.pancreas && aiParams.pancreas
        ? mergePartial(defaults.pancreas, clampPancreas(aiParams.pancreas))
        : defaults.pancreas,
    liver:
      defaults.liver && aiParams.liver
        ? mergePartial(defaults.liver, clampLiver(aiParams.liver))
        : defaults.liver,
    kidney:
      defaults.kidney && aiParams.kidney
        ? mergePartial(defaults.kidney, clampKidney(aiParams.kidney))
        : defaults.kidney,
    skeletal_muscle:
      defaults.skeletal_muscle && aiParams.skeletal_muscle
        ? mergePartial(defaults.skeletal_muscle, clampMuscle(aiParams.skeletal_muscle))
        : defaults.skeletal_muscle,
    brain:
      defaults.brain && aiParams.brain
        ? mergePartial(defaults.brain, clampBrain(aiParams.brain))
        : defaults.brain,
    adipose_tissue:
      defaults.adipose_tissue && aiParams.adipose_tissue
        ? mergePartial(defaults.adipose_tissue, clampAdipose(aiParams.adipose_tissue))
        : defaults.adipose_tissue,
  };
}
