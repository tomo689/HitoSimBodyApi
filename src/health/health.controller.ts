import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import {
  HealthSyncRequestDto,
  HealthSyncResponseDto,
} from './dto/health.dto.js';
import { HealthService } from './health.service.js';

@Controller('health')
@UseGuards(ApiKeyGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post('sync')
  sync(@Body() body: HealthSyncRequestDto): HealthSyncResponseDto {
    return this.healthService.syncHealthData(body);
  }
}
