import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { PaginationDto } from '@common/dto/pagination.dto';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { RESOURCES, ROLES } from '@common/constants';
import { RequireRoles } from '@common/decorators/roles.decorator';
import {
  ApiOkData,
  ApiCreatedData,
  ApiPaginatedResponse,
} from '@common/decorators/api-response.decorator';

@ApiTags('Reports')
@Controller({
  path: RESOURCES.REPORTS,
  version: '1',
})
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: 'List reports',
    description: 'Retrieve a paginated list of reports with optional search and sorting.',
  })
  @ApiPaginatedResponse(ReportResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.reportsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get report by ID',
    description: 'Retrieve a single report by its unique identifier.',
  })
  @ApiOkData(ReportResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create report',
    description:
      'Create a new report. Upload the cover image and document via POST /files/upload first, then pass their ids.',
  })
  @ApiCreatedData(ReportResponseDto)
  create(@Body() dto: CreateReportDto, @User() user: IUserSession) {
    return this.reportsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update report',
    description: 'Update an existing report by its unique identifier.',
  })
  @ApiOkData(ReportResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReportDto,
    @User() user: IUserSession,
  ) {
    return this.reportsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete report',
    description: 'Soft-delete a report by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Report deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.reportsService.remove(id, user);
  }
}
