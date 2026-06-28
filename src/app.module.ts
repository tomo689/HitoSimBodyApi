import { Module } from '@nestjs/common';
import { ApiKeyGuard } from './auth/api-key.guard.js';
import { EnvService } from './config/env.service.js';
import { OpenAiService } from './openai/openai.service.js';
import { PurposeController } from './purpose/purpose.controller.js';
import { PurposeService } from './purpose/purpose.service.js';
import { ReferenceController } from './reference/reference.controller.js';
import { ReferenceService } from './reference/reference.service.js';
import { RecommendationsController } from './recommendations/recommendations.controller.js';
import { RecommendationsService } from './recommendations/recommendations.service.js';
import { SimulationController } from './simulation/simulation.controller.js';
import { SimulationService } from './simulation/simulation.service.js';
import { ParameterResolverService } from './simulation/parameter-resolver.service.js';

@Module({
  controllers: [
    PurposeController,
    SimulationController,
    RecommendationsController,
    ReferenceController,
  ],
  providers: [
    EnvService,
    OpenAiService,
    PurposeService,
    SimulationService,
    ParameterResolverService,
    RecommendationsService,
    ReferenceService,
  ],
})
export class AppModule {}
