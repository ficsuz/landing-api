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

import { CouncilCalendarService } from './council-calendar.service';
import { CreateCouncilCalendarDto } from './dto/create-council-calendar.dto';
import { UpdateCouncilCalendarDto } from './dto/update-council-calendar.dto';
import { CouncilCalendarResponseDto } from './dto/council-calendar-response.dto';
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

@ApiTags('Council Calendar')
@Controller({
  path: RESOURCES.COUNCIL_CALENDAR,
  version: '1',
})
export class CouncilCalendarController {
  constructor(private readonly councilCalendarService: CouncilCalendarService) {}

  @Get()
  @ApiOperation({
    summary: 'List council calendar entries',
    description:
      'Retrieve a paginated list of council calendar entries with optional search and sorting.',
  })
  @ApiPaginatedResponse(CouncilCalendarResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.councilCalendarService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get council calendar entry by ID',
    description:
      'Retrieve a single council calendar entry by its unique identifier — the full "Learn more" detail.',
  })
  @ApiOkData(CouncilCalendarResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.councilCalendarService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create council calendar entry',
    description: 'Create a new council calendar entry.',
  })
  @ApiCreatedData(CouncilCalendarResponseDto)
  create(@Body() dto: CreateCouncilCalendarDto, @User() user: IUserSession) {
    return this.councilCalendarService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update council calendar entry',
    description: 'Update an existing council calendar entry by its unique identifier.',
  })
  @ApiOkData(CouncilCalendarResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouncilCalendarDto,
    @User() user: IUserSession,
  ) {
    return this.councilCalendarService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete council calendar entry',
    description: 'Soft-delete a council calendar entry by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Council calendar entry deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.councilCalendarService.remove(id, user);
  }
}
