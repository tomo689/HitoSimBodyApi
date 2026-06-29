import { Injectable } from '@nestjs/common';
import { healthSyncToInputs } from './health-mapper.js';
import {
  HealthSyncRequestDto,
  HealthSyncResponseDto,
} from './dto/health.dto.js';

@Injectable()
export class HealthService {
  syncHealthData(request: HealthSyncRequestDto): HealthSyncResponseDto {
    const inputs = healthSyncToInputs(request.entries);

    return {
      inputs,
      dayCount: request.entries.length,
      summary: `${request.entries.length} 日分の Apple Health データをシミュレーション入力に正規化しました。`,
    };
  }
}
