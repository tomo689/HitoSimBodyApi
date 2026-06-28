import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service.js';
import {
  buildDefaultParameters,
  mergeParameters,
} from '../organs/parameters/defaults.js';
import type {
  OrganParameterKey,
  OrganParametersMap,
  UserProfile,
} from '../organs/parameters/types.js';
import { resolveOrganModel } from '../organs/registry.js';

const SYSTEM_PROMPT = `あなたは Mathematical Medicine の専門家です。
ユーザーの年齢・性別・体格・生活習慣データに基づき、各臓器数理モデルの「個人化パラメータ」を JSON で返してください。

返却するのは個人差のあるパラメータのみです。物理定数（大気圧、FiO2、脂肪エネルギー密度7700等）は含めないでください。

必ず次の JSON スキーマに従い、指定された臓器キーのみを含めてください:
{
  "parameters": {
    "heart": {
      "basalStrokeVolume": number,
      "basalHeartRate": number,
      "vascularResistance": number,
      "vascularCompliance": number
    },
    "lung": {
      "basalRespiratoryRate": number,
      "basalTidalVolume": number,
      "vo2MaxEstimate": number
    },
    "pancreas": {
      "baselineGlucose": number,
      "baselineInsulin": number,
      "glucoseEffectiveness": number,
      "insulinSensitivity": number,
      "insulinActionRate": number
    },
    "liver": {
      "hepaticGlucoseProductionBasal": number,
      "exerciseSuppressionCoeff": number,
      "insulinSuppressionCoeff": number,
      "glycogenStore": number
    },
    "kidney": {
      "baselineGfr": number,
      "baselineFluidVolume": number
    },
    "skeletal_muscle": {
      "muscleMass": number,
      "proteinSynthesisRate": number,
      "proteinDegradationRate": number
    },
    "brain": {
      "baselineCmro2": number,
      "baselineCbf": number,
      "neurovascularCoupling": number
    },
    "adipose_tissue": {
      "initialFatMass": number,
      "baselineCalorieIntake": number,
      "baselineCalorieExpenditure": number
    }
  },
  "rationale": "パラメータ決定の簡潔な根拠（日本語）"
}

制約:
- 医学的に妥当な範囲の数値にすること
- defaultParameters を参考に、ユーザーデータに応じて調整すること
- 指定されていない臓器キーは含めないこと`;

export interface ParameterResolutionResult {
  parameters: OrganParametersMap;
  rationale: string;
  source: 'ai' | 'defaults';
}

@Injectable()
export class ParameterResolverService {
  constructor(private readonly openAi: OpenAiService) {}

  async resolve(
    profile: UserProfile,
    purpose: string,
    organs: { organId: string; organName: string }[],
    inputs: { name: string; value: number; unit: string }[],
    defaultParameters: OrganParametersMap,
  ): Promise<ParameterResolutionResult> {
    const organKeys = this.collectOrganKeys(organs);
    const defaults =
      Object.keys(defaultParameters).length > 0
        ? defaultParameters
        : buildDefaultParameters(profile, organKeys);

    try {
      const userPrompt = JSON.stringify(
        {
          userProfile: profile,
          purpose,
          organs: organs.map((o) => ({ id: o.organId, name: o.organName })),
          lifestyleInputs: inputs,
          defaultParameters: defaults,
          requiredOrganKeys: organKeys,
        },
        null,
        2,
      );

      const aiResult = await this.openAi.chatJson<{
        parameters: Partial<OrganParametersMap>;
        rationale: string;
      }>(SYSTEM_PROMPT, userPrompt);

      const merged = mergeParameters(defaults, aiResult.parameters ?? {});

      return {
        parameters: this.filterToRequiredOrgans(merged, organKeys),
        rationale: aiResult.rationale ?? '',
        source: 'ai',
      };
    } catch {
      return {
        parameters: defaults,
        rationale: 'AI パラメータ推定に失敗したため、年齢・性別・体格ベースのデフォルト値を使用しました。',
        source: 'defaults',
      };
    }
  }

  buildDefaults(
    profile: UserProfile,
    organs: { organId: string; organName: string }[],
  ): OrganParametersMap {
    return buildDefaultParameters(profile, this.collectOrganKeys(organs));
  }

  private collectOrganKeys(
    organs: { organId: string; organName: string }[],
  ): OrganParameterKey[] {
    const keys = new Set<OrganParameterKey>();
    for (const organ of organs) {
      const model = resolveOrganModel(organ.organId, organ.organName);
      if (model) {
        keys.add(model.key as OrganParameterKey);
      }
    }
    return [...keys];
  }

  private filterToRequiredOrgans(
    params: OrganParametersMap,
    keys: OrganParameterKey[],
  ): OrganParametersMap {
    const filtered: OrganParametersMap = {};
    for (const key of keys) {
      switch (key) {
        case 'heart':
          if (params.heart) filtered.heart = params.heart;
          break;
        case 'lung':
          if (params.lung) filtered.lung = params.lung;
          break;
        case 'pancreas':
          if (params.pancreas) filtered.pancreas = params.pancreas;
          break;
        case 'liver':
          if (params.liver) filtered.liver = params.liver;
          break;
        case 'kidney':
          if (params.kidney) filtered.kidney = params.kidney;
          break;
        case 'skeletal_muscle':
          if (params.skeletal_muscle) filtered.skeletal_muscle = params.skeletal_muscle;
          break;
        case 'brain':
          if (params.brain) filtered.brain = params.brain;
          break;
        case 'adipose_tissue':
          if (params.adipose_tissue) filtered.adipose_tissue = params.adipose_tissue;
          break;
      }
    }
    return filtered;
  }
}
