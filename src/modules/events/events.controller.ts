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

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
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

@ApiTags('Events')
@Controller({
  path: RESOURCES.EVENTS,
  version: '1',
})
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'List events',
    description: 'Retrieve a paginated list of events with optional search and sorting.',
  })
  @ApiPaginatedResponse(EventResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event by ID',
    description: 'Retrieve a single event by its unique identifier.',
  })
  @ApiOkData(EventResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create event',
    description: 'Create a new event.',
  })
  @ApiCreatedData(EventResponseDto)
  create(@Body() dto: CreateEventDto, @User() user: IUserSession) {
    return this.eventsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update event',
    description: 'Update an existing event by its unique identifier.',
  })
  @ApiOkData(EventResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
    @User() user: IUserSession,
  ) {
    return this.eventsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete event',
    description: 'Soft-delete an event by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Event deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.eventsService.remove(id, user);
  }
}
