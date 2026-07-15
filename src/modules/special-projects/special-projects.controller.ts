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

import { SpecialProjectsService } from './special-projects.service';
import { CreateSpecialProjectDto } from './dto/create-special-project.dto';
import { UpdateSpecialProjectDto } from './dto/update-special-project.dto';
import { SpecialProjectResponseDto } from './dto/special-project-response.dto';
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

@ApiTags('Special Projects')
@Controller({
  path: RESOURCES.SPECIAL_PROJECTS,
  version: '1',
})
export class SpecialProjectsController {
  constructor(private readonly specialProjectsService: SpecialProjectsService) {}

  @Get()
  @ApiOperation({
    summary: 'List special projects',
    description: 'Retrieve a paginated list of special projects with optional search and sorting.',
  })
  @ApiPaginatedResponse(SpecialProjectResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.specialProjectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get special project by ID',
    description: 'Retrieve a single special project by its unique identifier.',
  })
  @ApiOkData(SpecialProjectResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.specialProjectsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create special project',
    description: 'Create a new special project.',
  })
  @ApiCreatedData(SpecialProjectResponseDto)
  create(@Body() dto: CreateSpecialProjectDto, @User() user: IUserSession) {
    return this.specialProjectsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update special project',
    description: 'Update an existing special project by its unique identifier.',
  })
  @ApiOkData(SpecialProjectResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpecialProjectDto,
    @User() user: IUserSession,
  ) {
    return this.specialProjectsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete special project',
    description: 'Soft-delete a special project by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Special project deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.specialProjectsService.remove(id, user);
  }
}
