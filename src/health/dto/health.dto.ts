import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class HealthDayEntryDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  steps?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  activeEnergyKcal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  sleepHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  restingHeartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hrvSdnn?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  workoutMinutes?: number;
}

export class HealthSyncRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HealthDayEntryDto)
  entries!: HealthDayEntryDto[];
}

export class HealthSyncResponseDto {
  inputs!: { name: string; value: number; unit: string }[];
  dayCount!: number;
  summary!: string;
}
