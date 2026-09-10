import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV };
  }
}
