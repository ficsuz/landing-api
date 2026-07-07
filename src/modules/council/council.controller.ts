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

import { CouncilService } from './council.service';
import { CreateCouncilMemberDto } from './dto/create-council-member.dto';
import { UpdateCouncilMemberDto } from './dto/update-council-member.dto';
import { CouncilMemberResponseDto } from './dto/council-member-response.dto';
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

@ApiTags('Council')
@Controller({
  path: RESOURCES.COUNCIL,
  version: '1',
})
export class CouncilController {
  constructor(private readonly councilService: CouncilService) {}

  @Get()
  @ApiOperation({
    summary: 'List council members',
    description: 'Retrieve a paginated list of council members with optional search and sorting.',
  })
  @ApiPaginatedResponse(CouncilMemberResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.councilService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get council member by ID',
    description: 'Retrieve a single council member by their unique identifier.',
  })
  @ApiOkData(CouncilMemberResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.councilService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create council member',
    description: 'Create a new council member.',
  })
  @ApiCreatedData(CouncilMemberResponseDto)
  create(@Body() dto: CreateCouncilMemberDto, @User() user: IUserSession) {
    return this.councilService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update council member',
    description: 'Update an existing council member by their unique identifier.',
  })
  @ApiOkData(CouncilMemberResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouncilMemberDto,
    @User() user: IUserSession,
  ) {
    return this.councilService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete council member',
    description: 'Soft-delete a council member by their unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Council member deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.councilService.remove(id, user);
  }
}
