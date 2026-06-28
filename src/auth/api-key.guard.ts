import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { CloudflareRequest } from '@mridang/nestjs-platform-cloudflare';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<CloudflareRequest>();
    const apiKey = this.extractApiKey(request);
    const expectedKey = process.env.API_KEY ?? '';

    if (!apiKey) {
      throw new UnauthorizedException(
        'API key is required. Send it via X-API-Key header or Authorization: Bearer <key>.',
      );
    }

    if (!expectedKey || !this.timingSafeEqual(apiKey, expectedKey)) {
      throw new UnauthorizedException('Invalid API key.');
    }

    return true;
  }

  private extractApiKey(request: CloudflareRequest): string | undefined {
    const headerKey = request.get('x-api-key');
    if (headerKey) {
      return headerKey;
    }

    const authorization = request.get('authorization');
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice(7);
    }

    return undefined;
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
