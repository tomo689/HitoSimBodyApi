import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvService {
  get apiKey(): string {
    return process.env.API_KEY ?? '';
  }

  get openAiApiKey(): string {
    return process.env.OPENAI_API_KEY ?? '';
  }
}
