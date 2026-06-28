import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { SimulateRequestDto, SimulateResponseDto } from './dto/simulation.dto.js';
import { SimulationService } from './simulation.service.js';

@Controller('simulate')
@UseGuards(ApiKeyGuard)
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post()
  simulate(@Body() body: SimulateRequestDto): Promise<SimulateResponseDto> {
    return this.simulationService.runSimulation(body);
  }
}
