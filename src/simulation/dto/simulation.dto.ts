import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import type { Timescale } from '../../common/types.js';

class InputItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsNumber()
  value!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unit!: string;
}

class OutputRefDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;
}

class OrganRefDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

class AdditionalDataDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  value!: string;
}

export class HealthMetricsDto {
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

export class UserProfileDto {
  @IsNumber()
  @Min(1)
  @Max(120)
  age!: number;

  @IsEnum(['male', 'female', 'other'])
  gender!: 'male' | 'female' | 'other';

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(60)
  bodyFatPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  restingHeartRate?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalDataDto)
  additionalData?: AdditionalDataDto[];
}

export class SimulateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose!: string;

  @ValidateNested()
  @Type(() => UserProfileDto)
  userProfile!: UserProfileDto;

  @IsEnum(['hourly', 'daily', 'weekly', 'monthly'])
  timescale!: Timescale;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InputItemDto)
  inputs!: InputItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutputRefDto)
  outputs!: OutputRefDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrganRefDto)
  organs!: OrganRefDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthMetricsDto)
  healthMetrics?: HealthMetricsDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  mood?: 1 | 2 | 3 | 4 | 5;
}

export class OrganVisualizationDto {
  status!: 'healthy' | 'strained' | 'critical';
  primaryMetric!: string;
  bottleneckScore!: number;
}

export class WeakPointDto {
  outputId!: string;
  outputName!: string;
  severity!: 'low' | 'medium' | 'high';
  reason!: string;
  contributingOrganIds!: string[];
}

export class InsightCausalLinkDto {
  organ!: string;
  organId!: string;
  mechanism!: string;
  evidenceMetric!: string;
}

export class SimulationInsightDto {
  headline!: string;
  explanation!: string;
  causalChain!: InsightCausalLinkDto[];
  references!: string[];
}

export class BloodStateDto {
  functionLevel!: number;
  metrics!: { name: string; value: number; unit: string }[];
  timeSeries!: { label: string; value: number }[];
  summary!: string;
}

export class SimulateResponseDto {
  purpose!: string;
  timescale!: Timescale;
  parameterSource!: 'ai' | 'defaults';
  parameterRationale?: string;
  outputs!: {
    outputId: string;
    outputName: string;
    unit: string;
    dataPoints: { label: string; value: number }[];
    summary: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    sourceOrganKey?: string;
    modelKey?: string;
  }[];
  organs!: {
    organId: string;
    organName: string;
    modelKey: string;
    functionLevel: number;
    metrics: { name: string; value: number; unit: string }[];
    summary: string;
    timeSeries: { label: string; value: number }[];
    isDefaultOrgan?: boolean;
    visualization: OrganVisualizationDto;
  }[];
  blood!: BloodStateDto;
  weakPoints!: WeakPointDto[];
  insight?: SimulationInsightDto;
  modelsUsed?: string[];
  unresolvedOrgans?: string[];
  couplingEnabled?: boolean;
}
