import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import {
  RecommendationsRequestDto,
  RecommendationsResponseDto,
} from './dto/recommendations.dto.js';
import { RecommendationsService } from './recommendations.service.js';

@Controller('recommendations')
@UseGuards(ApiKeyGuard)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post()
  recommend(
    @Body() body: RecommendationsRequestDto,
  ): Promise<RecommendationsResponseDto> {
    return this.recommendationsService.generateRecommendations(body);
  }
}
