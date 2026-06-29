import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service.js';
import { PurposeResponseDto } from './dto/purpose.dto.js';
import { validateAndNormalizePurpose } from './purpose-validator.js';

const SYSTEM_PROMPT = `あなたは人体デジタルツインの専門家です。
ユーザーの健康・フィットネス目的に基づき、以下を JSON で返してください。

必ず次の JSON スキーマに従ってください:
{
  "outputs": [
    {
      "id": "snake_case_id",
      "name": "日本語名",
      "description": "このアウトプットが目的達成にどう関わるか",
      "unit": "単位（例: kg, %, bpm, kcal）"
    }
  ],
  "organs": [
    {
      "id": "snake_case_id",
      "name": "日本語の臓器・組織名",
      "role": "入力から出力への変換でこの臓器が果たす主な役割"
    }
  ]
}

制約:
- outputs は必ず 5 件
- organs は必ず 5 件
- id は英語の snake_case
- 医学的に妥当で、一般ユーザーにも理解しやすい説明にすること`;

@Injectable()
export class PurposeService {
  constructor(private readonly openAi: OpenAiService) {}

  async analyzePurpose(purpose: string): Promise<PurposeResponseDto> {
    const result = await this.openAi.chatJson<{
      outputs: PurposeResponseDto['outputs'];
      organs: PurposeResponseDto['organs'];
    }>(SYSTEM_PROMPT, `ユーザーの目的: ${purpose}`);

    return validateAndNormalizePurpose(purpose, result);
  }
}
