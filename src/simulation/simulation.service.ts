import { Injectable } from '@nestjs/common';
import { runOrganSimulation } from '../organs/simulation-engine.js';
import type { UserProfile } from '../organs/parameters/types.js';
import {
  SimulateRequestDto,
  SimulateResponseDto,
  UserProfileDto,
} from './dto/simulation.dto.js';
import { ParameterResolverService } from './parameter-resolver.service.js';

@Injectable()
export class SimulationService {
  constructor(
    private readonly parameterResolver: ParameterResolverService,
  ) {}

  async runSimulation(
    request: SimulateRequestDto,
  ): Promise<SimulateResponseDto> {
    const userProfile = this.toUserProfile(request.userProfile);
    const organRefs = request.organs.map((o) => ({
      organId: o.id,
      organName: o.name,
    }));

    const defaults = this.parameterResolver.buildDefaults(
      userProfile,
      organRefs,
    );

    const { parameters, rationale, source } =
      await this.parameterResolver.resolve(
        userProfile,
        request.purpose,
        organRefs,
        request.inputs,
        defaults,
      );

    const result = runOrganSimulation({
      timescale: request.timescale,
      userProfile,
      parameters,
      inputs: request.inputs,
      organs: organRefs,
      outputs: request.outputs,
    });

    return {
      purpose: request.purpose,
      timescale: request.timescale,
      parameterSource: source,
      parameterRationale: rationale,
      modelsUsed: result.modelsUsed,
      outputs: result.outputs.map((o) => ({
        outputId: o.outputId,
        outputName: o.outputName,
        unit: o.unit,
        dataPoints: o.dataPoints,
        summary: o.summary,
        trend: o.trend,
        sourceOrganKey: o.sourceOrganKey,
        modelKey: o.modelKey,
      })),
      organs: result.organs.map((o) => ({
        organId: o.organId,
        organName: o.organName,
        modelKey: o.modelKey,
        functionLevel: o.functionLevel,
        metrics: o.metrics,
        summary: o.summary,
      })),
      unresolvedOrgans: result.unresolvedOrgans,
    };
  }

  private toUserProfile(dto: UserProfileDto): UserProfile {
    return {
      age: dto.age,
      gender: dto.gender,
      heightCm: dto.heightCm,
      weightKg: dto.weightKg,
      bodyFatPercent: dto.bodyFatPercent,
      restingHeartRate: dto.restingHeartRate,
      additionalData: dto.additionalData?.map((d) => ({
        key: d.key,
        value: d.value,
      })),
    };
  }
}
