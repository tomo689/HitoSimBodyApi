import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { ReferenceService } from './reference.service.js';

@Controller('reference')
@UseGuards(ApiKeyGuard)
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  getCatalog() {
    return this.referenceService.getCatalog();
  }
}
