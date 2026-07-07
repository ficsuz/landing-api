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

import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamMemberResponseDto } from './dto/team-member-response.dto';
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

@ApiTags('Team')
@Controller({
  path: RESOURCES.TEAM,
  version: '1',
})
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({
    summary: 'List team members',
    description: 'Retrieve a paginated list of team members with optional search and sorting.',
  })
  @ApiPaginatedResponse(TeamMemberResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.teamService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get team member by ID',
    description: 'Retrieve a single team member by their unique identifier.',
  })
  @ApiOkData(TeamMemberResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create team member',
    description: 'Create a new team member.',
  })
  @ApiCreatedData(TeamMemberResponseDto)
  create(@Body() dto: CreateTeamMemberDto, @User() user: IUserSession) {
    return this.teamService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update team member',
    description: 'Update an existing team member by their unique identifier.',
  })
  @ApiOkData(TeamMemberResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberDto,
    @User() user: IUserSession,
  ) {
    return this.teamService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete team member',
    description: 'Soft-delete a team member by their unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Team member deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.teamService.remove(id, user);
  }
}
