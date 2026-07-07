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

import { ChronologyService } from './chronology.service';
import { CreateChronologyDto } from './dto/create-chronology.dto';
import { UpdateChronologyDto } from './dto/update-chronology.dto';
import { ChronologyResponseDto } from './dto/chronology-response.dto';
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

@ApiTags('Chronology')
@Controller({
  path: RESOURCES.CHRONOLOGY,
  version: '1',
})
export class ChronologyController {
  constructor(private readonly chronologyService: ChronologyService) {}

  @Get()
  @ApiOperation({
    summary: 'List chronology milestones',
    description:
      'Retrieve a paginated list of chronology milestones with optional search and sorting.',
  })
  @ApiPaginatedResponse(ChronologyResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.chronologyService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get chronology milestone by ID',
    description: 'Retrieve a single chronology milestone by its unique identifier.',
  })
  @ApiOkData(ChronologyResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.chronologyService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create chronology milestone',
    description: 'Create a new chronology milestone.',
  })
  @ApiCreatedData(ChronologyResponseDto)
  create(@Body() dto: CreateChronologyDto, @User() user: IUserSession) {
    return this.chronologyService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update chronology milestone',
    description: 'Update an existing chronology milestone by its unique identifier.',
  })
  @ApiOkData(ChronologyResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChronologyDto,
    @User() user: IUserSession,
  ) {
    return this.chronologyService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete chronology milestone',
    description: 'Soft-delete a chronology milestone by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Chronology milestone deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.chronologyService.remove(id, user);
  }
}
