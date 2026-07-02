import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { PurposeResponseDto } from '../../purpose/dto/purpose.dto.js';

export class CounselorMessageDto {
  @IsEnum(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}

export class HealthSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;
}

export class CreateCounselorSessionResponseDto {
  sessionId!: string;
  welcomeMessage!: string;
}

export class SendCounselorMessageRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounselorMessageDto)
  messages!: CounselorMessageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthSnapshotDto)
  healthSnapshot?: HealthSnapshotDto;
}

export class SendCounselorMessageResponseDto {
  sessionId!: string;
  reply!: string;
  clarifyingQuestions?: string[];
  purposeDraft?: string;
  outputs?: PurposeResponseDto['outputs'];
  organs?: PurposeResponseDto['organs'];
  readyToSimulate!: boolean;
}
