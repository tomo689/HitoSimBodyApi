import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service.js';
import { validateAndNormalizePurpose } from '../purpose/purpose-validator.js';
import {
  createCounselorSession,
  getCounselorSession,
  updateCounselorSession,
} from './counselor-session.store.js';
import {
  CreateCounselorSessionResponseDto,
  SendCounselorMessageRequestDto,
  SendCounselorMessageResponseDto,
} from './dto/counselor.dto.js';

const SYSTEM_PROMPT = `あなたは HitoSim の健康カウンセラー AI です。
ユーザーと対話しながら、以下を段階的に明確にしてください:
1. ユーザーのオリジナル健康目的
2. 右パネルに表示する5つの指標（outputs）
3. デジタルツインを構成する5つの臓器（organs）

必ず JSON で返してください:
{
  "reply": "ユーザーへの共感的な返答（日本語）",
  "clarifyingQuestions": ["追加で聞きたい質問（0〜2件）"],
  "purposeDraft": "現時点での目的の下書き（未確定なら null）",
  "outputs": null または [{ "id", "name", "description", "unit" }],
  "organs": null または [{ "id", "name", "role" }],
  "readyToSimulate": false
}

ルール:
- 初回はユーザーの悩みを深掘りし、clarifyingQuestions を1〜2件出す
- 十分な情報が集まったら readyToSimulate を true にし、outputs と organs を各5件確定
- outputs の id は snake_case、organs の id は heart, lung, pancreas, liver, kidney, skeletal_muscle, brain, adipose_tissue のいずれか
- 「運動しているのに痩せない」系の悩みには、エネルギー収支・筋量・代謝の観点で共感する
- 医学的に安全で、一般ユーザーにもわかりやすい日本語`;

@Injectable()
export class CounselorService {
  constructor(private readonly openAi: OpenAiService) {}

  createSession(): CreateCounselorSessionResponseDto {
    const session = createCounselorSession();
    return {
      sessionId: session.id,
      welcomeMessage:
        'こんにちは。HitoSim カウンセラーです。今いちばん改善したいことや、モヤモヤしていることを教えてください。',
    };
  }

  async sendMessage(
    sessionId: string,
    request: SendCounselorMessageRequestDto,
  ): Promise<SendCounselorMessageResponseDto> {
    const session = getCounselorSession(sessionId);
    if (!session) {
      throw new NotFoundException(`セッションが見つかりません: ${sessionId}`);
    }

    updateCounselorSession(sessionId, request.messages);

    const userPrompt = JSON.stringify(
      {
        conversation: request.messages,
        healthSnapshot: request.healthSnapshot ?? null,
      },
      null,
      2,
    );

    const result = await this.openAi.chatJson<{
      reply: string;
      clarifyingQuestions?: string[];
      purposeDraft?: string | null;
      outputs?: SendCounselorMessageResponseDto['outputs'];
      organs?: SendCounselorMessageResponseDto['organs'];
      readyToSimulate: boolean;
    }>(SYSTEM_PROMPT, userPrompt);

    const response: SendCounselorMessageResponseDto = {
      sessionId,
      reply: result.reply,
      clarifyingQuestions: result.clarifyingQuestions,
      purposeDraft: result.purposeDraft ?? undefined,
      readyToSimulate: result.readyToSimulate,
    };

    if (
      result.readyToSimulate &&
      result.outputs &&
      result.organs &&
      result.purposeDraft
    ) {
      const normalized = validateAndNormalizePurpose(result.purposeDraft, {
        outputs: result.outputs,
        organs: result.organs,
      });
      response.outputs = normalized.outputs;
      response.organs = normalized.organs;
      response.purposeDraft = normalized.purpose;
    }

    const updatedMessages = [
      ...request.messages,
      { role: 'assistant' as const, content: result.reply },
    ];
    updateCounselorSession(sessionId, updatedMessages);

    return response;
  }
}
