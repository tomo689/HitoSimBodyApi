import { adiposeTissueModel } from './models/adipose-tissue.model.js';
import { bloodModel } from './models/blood.model.js';
import { brainModel } from './models/brain.model.js';
import { heartModel } from './models/heart.model.js';
import { kidneyModel } from './models/kidney.model.js';
import { liverModel } from './models/liver.model.js';
import { lungModel } from './models/lung.model.js';
import { pancreasModel } from './models/pancreas.model.js';
import { skeletalMuscleModel } from './models/skeletal-muscle.model.js';
import type { OrganModel } from './types.js';

export const ORGAN_MODELS: OrganModel[] = [
  heartModel,
  lungModel,
  pancreasModel,
  liverModel,
  kidneyModel,
  skeletalMuscleModel,
  brainModel,
  adiposeTissueModel,
  bloodModel,
];

const aliasIndex = new Map<string, OrganModel>();

for (const model of ORGAN_MODELS) {
  aliasIndex.set(model.key, model);
  for (const alias of model.aliases) {
    aliasIndex.set(alias.toLowerCase(), model);
  }
}

export function resolveOrganModel(
  organId: string,
  organName: string,
): OrganModel | undefined {
  const idKey = organId.toLowerCase().replace(/\s+/g, '_');
  const direct = aliasIndex.get(idKey);
  if (direct) return direct;

  for (const [alias, model] of aliasIndex) {
    if (
      idKey.includes(alias) ||
      alias.includes(idKey) ||
      organName.toLowerCase().includes(alias)
    ) {
      return model;
    }
  }

  return undefined;
}

export function getOrganModelByKey(key: string): OrganModel | undefined {
  return ORGAN_MODELS.find((m) => m.key === key);
}
