import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { EnvService } from '../config/env.service.js';

interface ChatCompletionResponse {
  choices: { message: { content: string } }[];
}

@Injectable()
export class OpenAiService {
  private readonly model = 'gpt-4o-mini';

  constructor(private readonly envService: EnvService) {}

  async chatJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.envService.openAiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(
        `OpenAI API error (${response.status}): ${errorBody}`,
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException('OpenAI returned an empty response.');
    }

    return JSON.parse(content) as T;
  }
}
