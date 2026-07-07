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

import { DocumentCategoriesService } from './document-categories.service';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { DocumentCategoryResponseDto } from './dto/document-category-response.dto';
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

@ApiTags('Document Categories')
@Controller({
  path: RESOURCES.DOCUMENT_CATEGORIES,
  version: '1',
})
export class DocumentCategoriesController {
  constructor(private readonly documentCategoriesService: DocumentCategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List document categories',
    description: 'Retrieve a paginated list of document categories (the Documents page tabs).',
  })
  @ApiPaginatedResponse(DocumentCategoryResponseDto)
  findAll(@Query() query: PaginationDto) {
    return this.documentCategoriesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document category by ID',
    description: 'Retrieve a single document category by its unique identifier.',
  })
  @ApiOkData(DocumentCategoryResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentCategoriesService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create document category',
    description: 'Create a new document category (a new tab on the Documents page).',
  })
  @ApiCreatedData(DocumentCategoryResponseDto)
  create(@Body() dto: CreateDocumentCategoryDto, @User() user: IUserSession) {
    return this.documentCategoriesService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update document category',
    description: 'Update an existing document category by its unique identifier.',
  })
  @ApiOkData(DocumentCategoryResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentCategoryDto,
    @User() user: IUserSession,
  ) {
    return this.documentCategoriesService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete document category',
    description: 'Soft-delete a document category. Fails if any document still references it.',
  })
  @ApiNoContentResponse({ description: 'Document category deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.documentCategoriesService.remove(id, user);
  }
}
