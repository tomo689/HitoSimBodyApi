import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service.js';
import {
  RecommendationsRequestDto,
  RecommendationsResponseDto,
} from './dto/recommendations.dto.js';

const SYSTEM_PROMPT = `あなたは人体デジタルツインの健康コーチです。
シミュレーション結果を分析し、ユーザーの目的達成に最も効果的なアクションを 3 つ提案してください。

必ず次の JSON スキーマに従ってください:
{
  "recommendations": [
    {
      "title": "アクションのタイトル（簡潔）",
      "description": "具体的な行動内容と実践方法",
      "expectedImpact": "このアクションがもたらす期待される効果",
      "targetOutputs": ["改善が期待されるアウトプット id の配列"],
      "priority": 1
    }
  ]
}

制約:
- recommendations は必ず 3 件
- priority は 1（最優先）から 3 の整数
- シミュレーション結果の weak point を踏まえた実行可能な提案にすること
- 医学的に安全で現実的な内容にすること
- 日本語で記述すること`;

@Injectable()
export class RecommendationsService {
  constructor(private readonly openAi: OpenAiService) {}

  async generateRecommendations(
    request: RecommendationsRequestDto,
  ): Promise<RecommendationsResponseDto> {
    const userPrompt = JSON.stringify(request, null, 2);

    const result = await this.openAi.chatJson<{
      recommendations: RecommendationsResponseDto['recommendations'];
    }>(SYSTEM_PROMPT, userPrompt);

    return {
      purpose: request.purpose,
      recommendations: result.recommendations,
    };
  }
}
