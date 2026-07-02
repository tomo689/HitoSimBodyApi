import { runCoupledSimulation } from './coupled-runner.js';
import { ensureDefaultOrgans, isDefaultOrgan } from './default-organs.js';
import { ALWAYS_SIMULATE_ORGAN_KEYS } from './default-organs.js';
import { mapOutputsFromOrgans, type OrganResultEntry } from './output-mapper.js';
import { resolveOrganModel } from './registry.js';
import type { SimulationContext } from './types.js';
import type { OrganParametersMap, UserProfile } from './parameters/types.js';
import { buildDefaultParameters } from './parameters/defaults.js';
import {
  getTimescaleConfig,
  normalizeInputs,
} from './utils/simulation-utils.js';
import type { Timescale } from '../common/types.js';

export interface OrganSimulationInput {
  organId: string;
  organName: string;
}

export interface SimulationEngineRequest {
  timescale: Timescale;
  userProfile: UserProfile;
  parameters: OrganParametersMap;
  inputs: { name: string; value: number; unit: string }[];
  organs: OrganSimulationInput[];
  outputs: { id: string; name: string; unit: string }[];
}

export interface SimulationEngineOrganResult {
  organId: string;
  organName: string;
  modelKey: string;
  functionLevel: number;
  metrics: { name: string; value: number; unit: string }[];
  summary: string;
  timeSeries: { label: string; value: number }[];
  isDefaultOrgan?: boolean;
}

export interface SimulationEngineResult {
  context: SimulationContext;
  organEntries: OrganResultEntry[];
  organs: SimulationEngineOrganResult[];
  outputs: ReturnType<typeof mapOutputsFromOrgans>;
  modelsUsed: string[];
  unresolvedOrgans: string[];
  couplingEnabled: boolean;
}

function ensureBloodParameters(
  parameters: OrganParametersMap,
  profile: UserProfile,
): OrganParametersMap {
  if (parameters.blood) return parameters;
  const bloodDefaults = buildDefaultParameters(profile, ['blood']);
  return { ...parameters, blood: bloodDefaults.blood };
}

export function runOrganSimulation(
  request: SimulationEngineRequest,
): SimulationEngineResult {
  const organsWithDefaults = ensureDefaultOrgans(request.organs);
  const parameters = ensureBloodParameters(
    request.parameters,
    request.userProfile,
  );

  const timescaleConfig = getTimescaleConfig(request.timescale);
  const normalizedInputs = normalizeInputs(
    request.inputs,
    request.userProfile,
  );

  const context: SimulationContext = {
    timescale: request.timescale,
    stepCount: timescaleConfig.count,
    labels: timescaleConfig.labels,
    dtHours: timescaleConfig.dtHours,
    inputs: normalizedInputs,
    userProfile: request.userProfile,
    parameters,
  };

  const activeOrganKeys = new Set<string>();

  for (const organ of organsWithDefaults) {
    const model = resolveOrganModel(organ.organId, organ.organName);
    if (!model) continue;
    if (!parameters[model.key as keyof OrganParametersMap]) continue;

    activeOrganKeys.add(model.key);
  }

  for (const key of ALWAYS_SIMULATE_ORGAN_KEYS) {
    if (parameters[key as keyof OrganParametersMap]) {
      activeOrganKeys.add(key);
    }
  }

  const coupled = runCoupledSimulation(context, activeOrganKeys);

  const organResults = new Map<string, OrganResultEntry>();
  const modelsUsed: string[] = [];
  const unresolvedOrgans: string[] = [];

  for (const organ of organsWithDefaults) {
    const model = resolveOrganModel(organ.organId, organ.organName);
    if (!model) {
      unresolvedOrgans.push(organ.organId);
      continue;
    }

    if (!parameters[model.key as keyof OrganParametersMap]) {
      unresolvedOrgans.push(organ.organId);
      continue;
    }

    const stepValues = coupled.organStepValues.get(model.key);
    const simulated = model.simulate(context, {
      stepValues,
      sharedStateHistory: coupled.sharedStateHistory,
    });

    const entry: OrganResultEntry = {
      ...simulated,
      organId: organ.organId,
      organName: organ.organName,
      isDefaultOrgan: isDefaultOrgan(organ.organId, organ.organName),
    };

    organResults.set(organ.organId, entry);
    organResults.set(model.key, entry);
    modelsUsed.push(simulated.modelKey);
  }

  const mappedOutputs = mapOutputsFromOrgans(
    request.outputs,
    organResults,
    context,
  );

  const uniqueOrgans = new Map<string, OrganResultEntry>();
  for (const entry of organResults.values()) {
    uniqueOrgans.set(entry.organId, entry);
  }

  const organEntries = [...uniqueOrgans.values()];

  return {
    context,
    organEntries,
    organs: organEntries.map((r) => ({
      organId: r.organId,
      organName: r.organName,
      modelKey: r.modelKey,
      functionLevel: r.functionLevel,
      metrics: r.metrics,
      summary: r.summary,
      timeSeries: r.timeSeries,
      isDefaultOrgan: r.isDefaultOrgan,
    })),
    outputs: mappedOutputs,
    modelsUsed: [...new Set(modelsUsed)],
    unresolvedOrgans,
    couplingEnabled: true,
  };
}
