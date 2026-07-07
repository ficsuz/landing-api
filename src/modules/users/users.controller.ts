import { AuthGuard } from '@common/guards/auth.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
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
import { UsersService } from './users.service';
import { PaginationDto } from '@common/dto/pagination.dto';
import { User } from '@common/decorators/user.decorator';
import { IUser } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, ROLES } from '@common/constants';
import { RequireRoles } from '@common/decorators/roles.decorator';
import {
  ApiOkData,
  ApiCreatedData,
  ApiPaginatedResponse,
} from '@common/decorators/api-response.decorator';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Users')
@Controller({
  path: RESOURCES.USERS,
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'List users',
    description: 'Retrieve a paginated list of users with optional search and sorting.',
  })
  @ApiPaginatedResponse(UserResponseDto)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get('me')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user, including roles.',
  })
  @ApiOkData(UserResponseDto)
  getProfile(@User() user: IUser) {
    return this.usersService.findById(user.id);
  }

  @Get(':id')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve a single user by their unique identifier, including roles.',
  })
  @ApiOkData(UserResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create user',
    description: 'Create a new user account.',
  })
  @ApiCreatedData(UserResponseDto)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update user',
    description: 'Update an existing user by their unique identifier.',
  })
  @ApiOkData(UserResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() user: IUserSession,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Soft-delete a user by their unique identifier.',
  })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.usersService.delete(id, user);
  }
}
