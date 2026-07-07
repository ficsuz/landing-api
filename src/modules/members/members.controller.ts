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

import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberQueryDto } from './dto/member-query.dto';
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

@ApiTags('Members')
@Controller({
  path: RESOURCES.MEMBERS,
  version: '1',
})
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({
    summary: 'List council members',
    description:
      'Retrieve a paginated list of Foreign Investors Council member companies with optional ' +
      'search, sorting, and membership filter (?type=EXECUTIVE_BOARD|FULL|OBSERVER).',
  })
  @ApiPaginatedResponse(MemberResponseDto)
  findAll(@Query() query: MemberQueryDto) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get council member by ID',
    description: 'Retrieve a single council member company by its unique identifier.',
  })
  @ApiOkData(MemberResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.membersService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create council member',
    description: 'Create a new council member company.',
  })
  @ApiCreatedData(MemberResponseDto)
  create(@Body() dto: CreateMemberDto, @User() user: IUserSession) {
    return this.membersService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update council member',
    description: 'Update an existing council member company by its unique identifier.',
  })
  @ApiOkData(MemberResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMemberDto,
    @User() user: IUserSession,
  ) {
    return this.membersService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete council member',
    description: 'Soft-delete a council member company by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Council member deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.membersService.remove(id, user);
  }
}
