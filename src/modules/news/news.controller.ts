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

import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsResponseDto } from './dto/news-response.dto';
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

@ApiTags('News')
@Controller({
  path: RESOURCES.NEWS,
  version: '1',
})
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({
    summary: 'List news',
    description: 'Retrieve a paginated list of news articles with optional search and sorting.',
  })
  @ApiPaginatedResponse(NewsResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.newsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get news article by ID',
    description: 'Retrieve a single news article by its unique identifier.',
  })
  @ApiOkData(NewsResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.newsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create news article',
    description: 'Create a new news article.',
  })
  @ApiCreatedData(NewsResponseDto)
  create(@Body() dto: CreateNewsDto, @User() user: IUserSession) {
    return this.newsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update news article',
    description: 'Update an existing news article by its unique identifier.',
  })
  @ApiOkData(NewsResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNewsDto,
    @User() user: IUserSession,
  ) {
    return this.newsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete news article',
    description: 'Soft-delete a news article by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'News article deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.newsService.remove(id, user);
  }
}
