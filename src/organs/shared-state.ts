import { PHYSICAL_CONSTANTS as C } from './constants.js';
import type { SimulationContext } from './types.js';

/** 臓器間で共有するシミュレーション状態（1 ステップ分） */
export interface SimulationSharedState {
  bloodGlucose: number;
  insulinAction: number;
  hepaticGlucoseProduction: number;
  meanArterialPressure: number;
  cardiacOutput: number;
  vo2: number;
  fluidVolume: number;
  oxygenDelivery: number;
  muscleGlucoseUptake: number;
  /** ヘマトクリット % */
  hematocrit: number;
  /** 酸素飽和度 SpO2 % */
  oxygenSaturation: number;
}

/** 結合ステップ内の臓器固有内部状態 */
export interface CoupledInternalState {
  muscleMass: number;
  glycogen: number;
  fatMass: number;
}

export interface CoupledStepState {
  shared: SimulationSharedState;
  internal: CoupledInternalState;
}

export function createInitialSharedState(
  context: SimulationContext,
): SimulationSharedState {
  const heart = context.parameters.heart;
  const pancreas = context.parameters.pancreas;
  const liver = context.parameters.liver;
  const kidney = context.parameters.kidney;
  const lung = context.parameters.lung;
  const blood = context.parameters.blood;

  const co = heart
    ? (heart.basalStrokeVolume * heart.basalHeartRate) / 1000
    : 5;
  const vo2 = lung
    ? lung.basalRespiratoryRate * lung.basalTidalVolume * 0.05
    : 0.3;

  return {
    bloodGlucose:
      pancreas?.baselineGlucose ?? blood?.baselineGlucose ?? 90,
    insulinAction: 0,
    hepaticGlucoseProduction:
      liver?.hepaticGlucoseProductionBasal ?? 9,
    meanArterialPressure: C.MAP_REFERENCE,
    cardiacOutput: co,
    vo2,
    fluidVolume: kidney?.baselineFluidVolume ?? 40,
    oxygenDelivery: co * vo2 * 10,
    muscleGlucoseUptake: 0,
    hematocrit: blood?.baselineHematocrit ?? 42,
    oxygenSaturation: 97,
  };
}

export function createCoupledStepState(
  context: SimulationContext,
): CoupledStepState {
  return {
    shared: createInitialSharedState(context),
    internal: {
      muscleMass: context.parameters.skeletal_muscle?.muscleMass ?? 30,
      glycogen: context.parameters.liver?.glycogenStore ?? 80,
      fatMass: context.parameters.adipose_tissue?.initialFatMass ?? 15,
    },
  };
}
