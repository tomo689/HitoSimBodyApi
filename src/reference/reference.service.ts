import { Injectable } from '@nestjs/common';
import {
  getModelCatalog,
  getPaperIndex,
  type ModelCatalogEntry,
  type PaperReference,
} from '../reference/models-catalog.js';

export interface ReferenceResponseDto {
  models: ModelCatalogEntry[];
  papers: PaperReference[];
  summary: {
    modelCount: number;
    paperCount: number;
    organs: string[];
  };
}

@Injectable()
export class ReferenceService {
  getCatalog(): ReferenceResponseDto {
    const models = getModelCatalog();
    const papers = getPaperIndex();

    return {
      models,
      papers,
      summary: {
        modelCount: models.length,
        paperCount: papers.length,
        organs: models.map((m) => m.organNameJa),
      },
    };
  }
}
