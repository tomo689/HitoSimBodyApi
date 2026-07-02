import { Injectable } from '@nestjs/common';
import { runOrganSimulation } from '../organs/simulation-engine.js';
import { mapBloodStateFromOrgan } from '../organs/analysis/blood-state.js';
import { computeInsights } from '../organs/analysis/insights.js';
import { buildOrganVisualization } from '../organs/analysis/visualization.js';
import { computeWeakPoints } from '../organs/analysis/weak-points.js';
import { ensureDefaultOrgans } from '../organs/default-organs.js';
import type { UserProfile } from '../organs/parameters/types.js';
import { healthMetricsToInputs } from '../health/health-mapper.js';
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
    const organRefs = ensureDefaultOrgans(
      request.organs.map((o) => ({
        organId: o.id,
        organName: o.name,
      })),
    );

    const mergedInputs = [
      ...request.inputs,
      ...healthMetricsToInputs(request.healthMetrics),
    ];

    const defaults = this.parameterResolver.buildDefaults(
      userProfile,
      organRefs,
    );

    const { parameters, rationale, source } =
      await this.parameterResolver.resolve(
        userProfile,
        request.purpose,
        organRefs,
        mergedInputs,
        defaults,
      );

    const result = runOrganSimulation({
      timescale: request.timescale,
      userProfile,
      parameters,
      inputs: mergedInputs,
      organs: organRefs,
      outputs: request.outputs,
    });

    const weakPoints = computeWeakPoints(
      result.outputs,
      result.organEntries,
      result.context,
      request.purpose,
    );

    const insight = computeInsights(
      request.purpose,
      result.outputs,
      result.organEntries,
      result.context,
      weakPoints,
    );

    const blood = mapBloodStateFromOrgan(result.organEntries);

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
      organs: result.organEntries.map((o) => ({
        organId: o.organId,
        organName: o.organName,
        modelKey: o.modelKey,
        functionLevel: o.functionLevel,
        metrics: o.metrics,
        summary: o.summary,
        timeSeries: o.timeSeries,
        isDefaultOrgan: o.isDefaultOrgan,
        visualization: buildOrganVisualization(o),
      })),
      blood,
      weakPoints,
      insight,
      unresolvedOrgans: result.unresolvedOrgans,
      couplingEnabled: result.couplingEnabled,
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
