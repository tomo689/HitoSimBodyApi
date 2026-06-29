import { getOrganModelByKey } from './registry.js';
import { sortByCouplingOrder } from './coupling-order.js';
import {
  createCoupledStepState,
  type CoupledStepState,
  type SimulationSharedState,
} from './shared-state.js';
import type { SimulationContext } from './types.js';

export interface CoupledSimulationResult {
  organStepValues: Map<string, number[]>;
  sharedStateHistory: SimulationSharedState[];
}

export function runCoupledSimulation(
  context: SimulationContext,
  activeOrganKeys: Set<string>,
): CoupledSimulationResult {
  const stepState = createCoupledStepState(context);
  const sharedStateHistory: SimulationSharedState[] = [];
  const organStepValues = new Map<string, number[]>();

  const keysToRun = sortByCouplingOrder(
    [...activeOrganKeys].filter((key) => {
      const model = getOrganModelByKey(key);
      return model?.coupledStep && model.supportsCoupling !== false;
    }),
  );

  if (!keysToRun.includes('blood')) {
    keysToRun.push('blood');
  }

  for (const key of keysToRun) {
    organStepValues.set(key, []);
  }

  for (let step = 0; step < context.stepCount; step++) {
    for (const key of keysToRun) {
      const model = getOrganModelByKey(key);
      if (!model?.coupledStep) continue;
      const value = model.coupledStep(context, step, stepState);
      organStepValues.get(key)!.push(value);
    }
    sharedStateHistory.push({ ...stepState.shared });
  }

  return { organStepValues, sharedStateHistory };
}

export type { CoupledStepState };
