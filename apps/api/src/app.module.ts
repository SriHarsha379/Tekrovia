import { Module, Controller, Get } from '@nestjs/common';

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'api', timestamp: new Date().toISOString() };
  }
}

@Module({ controllers: [HealthController] })
export class AppModule {}
