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

import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { DocumentQueryDto } from './dto/document-query.dto';
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

@ApiTags('Documents')
@Controller({
  path: RESOURCES.DOCUMENTS,
  version: '1',
})
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List documents',
    description:
      'Retrieve a paginated list of official documents with optional search, sorting, and a ' +
      'category filter (?categoryId=<uuid> — a DocumentCategories id; fetch the available tabs ' +
      'via GET /document-categories).',
  })
  @ApiPaginatedResponse(DocumentResponseDto)
  findAll(@Query() query: DocumentQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieve a single document by its unique identifier.',
  })
  @ApiOkData(DocumentResponseDto)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create document',
    description:
      'Create a new document. Upload the file via POST /files/upload first, then pass its id.',
  })
  @ApiCreatedData(DocumentResponseDto)
  create(@Body() dto: CreateDocumentDto, @User() user: IUserSession) {
    return this.documentsService.create(dto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update document',
    description: 'Update an existing document by its unique identifier.',
  })
  @ApiOkData(DocumentResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentDto,
    @User() user: IUserSession,
  ) {
    return this.documentsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Soft-delete a document by its unique identifier.',
  })
  @ApiNoContentResponse({ description: 'Document deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: IUserSession) {
    return this.documentsService.remove(id, user);
  }
}
