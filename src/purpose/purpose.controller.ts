import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { PurposeRequestDto, PurposeResponseDto } from './dto/purpose.dto.js';
import { PurposeService } from './purpose.service.js';

@Controller('purpose')
@UseGuards(ApiKeyGuard)
export class PurposeController {
  constructor(private readonly purposeService: PurposeService) {}

  @Post()
  analyze(@Body() body: PurposeRequestDto): Promise<PurposeResponseDto> {
    return this.purposeService.analyzePurpose(body.purpose);
  }
}
