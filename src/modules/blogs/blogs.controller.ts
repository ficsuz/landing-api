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

import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { BlogResponseDto } from './dto/blog-response.dto';
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

@ApiTags('Blogs')
@Controller({
  path: RESOURCES.BLOGS,
  version: '1',
})
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({
    summary: 'List blogs',
    description: 'Retrieve a paginated list of blog posts with optional search and sorting.',
  })
  @ApiPaginatedResponse(BlogResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.blogsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get blog by ID',
    description: 'Retrieve a single blog post by its unique identifier.',
  })
  @ApiOkData(BlogResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create blog',
    description: 'Create a new blog post.',
  })
  @ApiCreatedData(BlogResponseDto)
  create(@Body() dto: CreateBlogDto, @User() user: IUserSession) {
    return this.blogsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update blog',
    description: 'Update an existing blog post by its unique identifier.',
  })
  @ApiOkData(BlogResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBlogDto,
    @User() user: IUserSession,
  ) {
    return this.blogsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete blog',
    description: 'Soft-delete a blog post by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Blog deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.blogsService.remove(id, user);
  }
}
