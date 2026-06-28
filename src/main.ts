import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CloudflareAdapter } from '@mridang/nestjs-platform-cloudflare';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/all-exceptions.filter.js';

const adapter = new CloudflareAdapter();
const app = await NestFactory.create(AppModule, adapter, { logger: ['error', 'warn'] });
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
app.useGlobalFilters(new AllExceptionsFilter());
app.enableCors();
await app.init();

export default {
  fetch: (request: Request): Promise<Response> => adapter.handle(request),
};
