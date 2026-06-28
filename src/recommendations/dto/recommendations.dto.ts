import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import type { Timescale } from '../../common/types.js';

class SimulationOutputDto {
  @IsString()
  @IsNotEmpty()
  outputId!: string;

  @IsString()
  @IsNotEmpty()
  outputName!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsArray()
  dataPoints!: { label: string; value: number }[];

  @IsString()
  summary!: string;

  @IsEnum(['increasing', 'decreasing', 'stable'])
  trend!: 'increasing' | 'decreasing' | 'stable';
}

class SimulationOrganDto {
  @IsString()
  @IsNotEmpty()
  organId!: string;

  @IsString()
  @IsNotEmpty()
  organName!: string;

  @IsNumber()
  functionLevel!: number;

  @IsArray()
  metrics!: { name: string; value: number; unit: string }[];

  @IsString()
  summary!: string;
}

export class RecommendationsRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose!: string;

  @IsEnum(['hourly', 'daily', 'weekly', 'monthly'])
  timescale!: Timescale;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulationOutputDto)
  outputs!: SimulationOutputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimulationOrganDto)
  organs!: SimulationOrganDto[];
}

export class RecommendationsResponseDto {
  purpose!: string;
  recommendations!: {
    title: string;
    description: string;
    expectedImpact: string;
    targetOutputs: string[];
    priority: number;
  }[];
}
