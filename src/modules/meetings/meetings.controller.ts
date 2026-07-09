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

import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingResponseDto } from './dto/meeting-response.dto';
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

@ApiTags('Meetings')
@Controller({
  path: RESOURCES.MEETINGS,
  version: '1',
})
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @ApiOperation({
    summary: 'List meetings',
    description: 'Retrieve a paginated list of meetings with optional search and sorting.',
  })
  @ApiPaginatedResponse(MeetingResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.meetingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get meeting by ID',
    description: 'Retrieve a single meeting by its unique identifier.',
  })
  @ApiOkData(MeetingResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.meetingsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create meeting',
    description: 'Create a new meeting.',
  })
  @ApiCreatedData(MeetingResponseDto)
  create(@Body() dto: CreateMeetingDto, @User() user: IUserSession) {
    return this.meetingsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update meeting',
    description: 'Update an existing meeting by its unique identifier.',
  })
  @ApiOkData(MeetingResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMeetingDto,
    @User() user: IUserSession,
  ) {
    return this.meetingsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete meeting',
    description: 'Soft-delete a meeting by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Meeting deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.meetingsService.remove(id, user);
  }
}
