import { BadRequestException } from '@nestjs/common';
import { ORGAN_MODELS, resolveOrganModel } from '../organs/registry.js';
import type { PurposeResponseDto } from './dto/purpose.dto.js';

const REQUIRED_COUNT = 5;

export const VALID_ORGAN_IDS = ORGAN_MODELS.map((m) => m.key);

function normalizeOrgan(
  organ: PurposeResponseDto['organs'][0],
  usedKeys: Set<string>,
): PurposeResponseDto['organs'][0] {
  const model = resolveOrganModel(organ.id, organ.name);
  if (model && !usedKeys.has(model.key)) {
    usedKeys.add(model.key);
    return {
      id: model.key,
      name: model.nameJa,
      role: organ.role,
    };
  }

  for (const candidate of ORGAN_MODELS) {
    if (!usedKeys.has(candidate.key)) {
      usedKeys.add(candidate.key);
      return {
        id: candidate.key,
        name: candidate.nameJa,
        role: organ.role || `${candidate.nameJa}の代謝・機能が目的達成に関与`,
      };
    }
  }

  return organ;
}

function padToFive<T>(items: T[], filler: (index: number) => T): T[] {
  const result = [...items];
  while (result.length < REQUIRED_COUNT) {
    result.push(filler(result.length));
  }
  return result.slice(0, REQUIRED_COUNT);
}

export function validateAndNormalizePurpose(
  purpose: string,
  raw: {
    outputs: PurposeResponseDto['outputs'];
    organs: PurposeResponseDto['organs'];
  },
): PurposeResponseDto {
  const outputs = padToFive(raw.outputs ?? [], (i) => ({
    id: `output_${i + 1}`,
    name: `指標${i + 1}`,
    description: '目的達成の進捗指標',
    unit: '-',
  }));

  const usedOrganKeys = new Set<string>();
  const normalizedOrgans = padToFive(raw.organs ?? [], (i) => ({
    id: VALID_ORGAN_IDS[i % VALID_ORGAN_IDS.length],
    name: ORGAN_MODELS[i % ORGAN_MODELS.length].nameJa,
    role: '目的達成に関与する臓器',
  })).map((organ) => normalizeOrgan(organ, usedOrganKeys));

  const unresolved = normalizedOrgans.filter(
    (o) => !resolveOrganModel(o.id, o.name),
  );
  if (unresolved.length > 0) {
    throw new BadRequestException(
      `臓器 id を解決できません: ${unresolved.map((o) => o.id).join(', ')}`,
    );
  }

  return { purpose, outputs, organs: normalizedOrgans };
}
