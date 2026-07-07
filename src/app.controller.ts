import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check', description: 'Reports service and database status' })
  getHealth() {
    return this.appService.getHealth();
  }
}
