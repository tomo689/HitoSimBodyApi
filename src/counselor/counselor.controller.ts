import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { CounselorService } from './counselor.service.js';
import {
  CreateCounselorSessionResponseDto,
  SendCounselorMessageRequestDto,
  SendCounselorMessageResponseDto,
} from './dto/counselor.dto.js';

@Controller('counselor')
@UseGuards(ApiKeyGuard)
export class CounselorController {
  constructor(private readonly counselorService: CounselorService) {}

  @Post('sessions')
  createSession(): CreateCounselorSessionResponseDto {
    return this.counselorService.createSession();
  }

  @Post('sessions/:sessionId/messages')
  sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: SendCounselorMessageRequestDto,
  ): Promise<SendCounselorMessageResponseDto> {
    return this.counselorService.sendMessage(sessionId, body);
  }
}
