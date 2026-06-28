import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PurposeRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose!: string;
}

export class PurposeResponseDto {
  purpose!: string;
  outputs!: {
    id: string;
    name: string;
    description: string;
    unit: string;
  }[];
  organs!: {
    id: string;
    name: string;
    role: string;
  }[];
}
