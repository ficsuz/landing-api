import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { RequireRoles } from '@common/decorators/roles.decorator';
import { User } from '@common/decorators/user.decorator';
import {
  ApiCreatedData,
  ApiOkData,
  ApiPaginatedResponse,
} from '@common/decorators/api-response.decorator';
import { PaginationDto } from '@common/dto/pagination.dto';
import { RESOURCES, ROLES } from '@common/constants';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';

@ApiTags('Jobs')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, AuthGuard)
@Controller({ path: RESOURCES.JOBS, version: '1' })
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create a job',
    description:
      'Creates a pipeline job from an ordered list of step types and enqueues the first step for background processing. The remaining steps run sequentially as each one completes.',
  })
  @ApiCreatedData(JobResponseDto)
  create(@Body() dto: CreateJobDto, @User() user: IUserSession) {
    return this.jobsService.createJob(dto, user.id);
  }

  @Get()
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({ summary: 'List jobs' })
  @ApiPaginatedResponse(JobResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get a job by id',
    description: 'Returns the job and the status of each of its steps, ordered by step number.',
  })
  @ApiOkData(JobResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findById(id);
  }

  @Post(':id/retry')
  @RequireRoles(ROLES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retry a failed job',
    description: 'Resets the failed step and re-enqueues it, resuming the run from that step.',
  })
  @ApiOkData(JobResponseDto)
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.retryJob(id);
  }
}
