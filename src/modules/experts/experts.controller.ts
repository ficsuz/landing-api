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

import { ExpertsService } from './experts.service';
import { CreateExpertDto } from './dto/create-expert.dto';
import { UpdateExpertDto } from './dto/update-expert.dto';
import { ExpertResponseDto } from './dto/expert-response.dto';
import { ExpertQueryDto } from './dto/expert-query.dto';
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

@ApiTags('Experts')
@Controller({
  path: RESOURCES.EXPERTS,
  version: '1',
})
export class ExpertsController {
  constructor(private readonly expertsService: ExpertsService) {}

  @Get()
  @ApiOperation({
    summary: 'List experts',
    description:
      'Retrieve a paginated list of experts with optional search, sorting, and feed filter ' +
      '(?type=INTERNATIONAL|UZBEK|LOCAL).',
  })
  @ApiPaginatedResponse(ExpertResponseDto)
  findAll(@Query() query: ExpertQueryDto) {
    return this.expertsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get expert by ID',
    description: 'Retrieve a single expert by their unique identifier.',
  })
  @ApiOkData(ExpertResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.expertsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create expert',
    description: 'Create a new expert.',
  })
  @ApiCreatedData(ExpertResponseDto)
  create(@Body() dto: CreateExpertDto, @User() user: IUserSession) {
    return this.expertsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update expert',
    description: 'Update an existing expert by their unique identifier.',
  })
  @ApiOkData(ExpertResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpertDto,
    @User() user: IUserSession,
  ) {
    return this.expertsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete expert',
    description: 'Soft-delete an expert by their unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Expert deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.expertsService.remove(id, user);
  }
}
