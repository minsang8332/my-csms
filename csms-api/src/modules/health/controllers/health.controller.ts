import { Controller, Get } from '@nestjs/common';
import { Public } from '@/modules/auth/rbac/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check() {
    return { status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV };
  }
}
