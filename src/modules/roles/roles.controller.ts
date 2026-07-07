import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { RoleWithPermissionsResponseDto } from './dto/role-with-permissions-response.dto';
import { RolesService } from './roles.service';
import { RequireRoles } from '@common/decorators/roles.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { PaginationDto } from '@common/dto/pagination.dto';
import {
  ApiOkData,
  ApiCreatedData,
  ApiOkArray,
  ApiMessageResponse,
  ApiPaginatedResponse,
} from '@common/decorators/api-response.decorator';
import { RESOURCES, ROLES } from '@common/constants';

@ApiTags('Roles')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, AuthGuard)
@Controller({
  path: RESOURCES.ROLES,
  version: '1',
})
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create a role',
    description: 'Creates a new role and optionally assigns it a set of permissions.',
  })
  @ApiCreatedData(RoleResponseDto)
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUserSession) {
    return this.rolesService.create(createRoleDto, user);
  }

  @Get()
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'List roles',
    description: 'Returns a paginated, searchable list of roles.',
  })
  @ApiPaginatedResponse(RoleResponseDto)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.rolesService.findAll(paginationDto);
  }

  @Get(':id')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get a role by ID',
    description: 'Returns a single role by its unique identifier.',
  })
  @ApiOkData(RoleResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update a role',
    description: "Updates a role's name, description and optionally replaces its permissions.",
  })
  @ApiOkData(RoleResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: IUserSession,
  ) {
    return this.rolesService.update(id, updateRoleDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete a role',
    description: 'Soft-deletes a role. System roles cannot be deleted.',
  })
  @ApiNoContentResponse({ description: 'Role deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.rolesService.remove(id, user);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Assign roles to a user',
    description: "Replaces a user's role assignments with the provided set of roles.",
  })
  @ApiMessageResponse({ description: 'Roles assigned successfully' })
  assignRoles(@Body() assignRoleDto: AssignRoleDto, @User() user: IUserSession) {
    return this.rolesService.assignRolesToUser(assignRoleDto, user);
  }

  @Post('assign-permissions')
  @HttpCode(HttpStatus.OK)
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Assign permissions to a role',
    description: "Replaces a role's permission assignments with the provided set of permissions.",
  })
  @ApiMessageResponse({ description: 'Permissions assigned successfully' })
  assignPermissions(
    @Body() assignPermissionsDto: AssignPermissionsDto,
    @User() user: IUserSession,
  ) {
    return this.rolesService.assignPermissions(assignPermissionsDto, user);
  }

  @Get(':id/permissions')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get permissions of a role',
    description: 'Returns a role together with the permissions it grants.',
  })
  @ApiOkData(RoleWithPermissionsResponseDto)
  listRolesWithPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.listRolesWithPermissions(id);
  }

  @Get('user/:userId/roles')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get roles of a user',
    description: 'Returns all roles assigned to the given user.',
  })
  @ApiOkArray(RoleResponseDto)
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Get('user/:userId/permissions')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Get permissions of a user',
    description: 'Returns all permissions granted to the given user through their roles.',
  })
  @ApiOkArray(PermissionResponseDto)
  getUserPermissions(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.rolesService.getUserPermissions(userId);
  }
}
