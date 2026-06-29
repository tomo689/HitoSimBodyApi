import { resolveOrganModel } from './registry.js';
import type { OrganSimulationInput } from './simulation-engine.js';

/** AI 選定に関わらず常にシミュレーションする臓器 */
export const ALWAYS_SIMULATE_ORGANS: OrganSimulationInput[] = [
  { organId: 'blood', organName: '血液' },
];

/** 常時実行臓器のモデルキー */
export const ALWAYS_SIMULATE_ORGAN_KEYS = ['blood'] as const;

export function ensureDefaultOrgans(
  organs: OrganSimulationInput[],
): OrganSimulationInput[] {
  const result = [...organs];
  const existingKeys = new Set(
    organs
      .map((o) => resolveOrganModel(o.organId, o.organName)?.key)
      .filter(Boolean),
  );

  for (const defaultOrgan of ALWAYS_SIMULATE_ORGANS) {
    const model = resolveOrganModel(
      defaultOrgan.organId,
      defaultOrgan.organName,
    );
    if (model && !existingKeys.has(model.key)) {
      result.push(defaultOrgan);
      existingKeys.add(model.key);
    }
  }

  return result;
}

export function isDefaultOrgan(organId: string, organName: string): boolean {
  const model = resolveOrganModel(organId, organName);
  return model?.key === 'blood';
}
