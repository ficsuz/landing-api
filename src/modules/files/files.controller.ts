import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { FilesService } from './files.service';
import { BufferedFile } from './interfaces/file.interface';
import { FileResponseDto } from './dto/file-response.dto';
import { GetFileQueryDto } from './dto/get-file-query.dto';
import { User } from '@common/decorators/user.decorator';
import { ApiCreatedData, ApiDataResponse } from '@common/decorators/api-response.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { AuthGuard } from '@common/guards/auth.guard';
import { RESOURCES, ROLES } from '@common/constants';
import { RequireRoles } from '@common/decorators/roles.decorator';

const MAX_UPLOAD_FILES = 20;

@ApiTags('Files')
@Controller({
  path: RESOURCES.FILES,
  version: '1',
})
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Uploads a single file (multipart/form-data) to object storage and returns its metadata.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @ApiCreatedData(FileResponseDto)
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: BufferedFile, @User() user: IUserSession) {
    return this.filesService.upload(file, user);
  }

  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard, AuthGuard)
  @ApiBearerAuth('authorization')
  @RequireRoles(ROLES.ADMIN, ROLES.USER)
  @ApiOperation({
    summary: 'Upload multiple files',
    description:
      'Uploads several files at once (multipart/form-data, repeated `files` field) to object ' +
      'storage and returns their metadata in the original order.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @ApiDataResponse(FileResponseDto, { status: HttpStatus.CREATED, isArray: true })
  @UseInterceptors(FilesInterceptor('files', MAX_UPLOAD_FILES))
  uploadMultiple(@UploadedFiles() files: BufferedFile[], @User() user: IUserSession) {
    return this.filesService.uploadMany(files, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a file (inline or download)',
    description:
      'Streams a stored file. `?download=true` forces an attachment download (and logs it to ' +
      'history); otherwise (`download=false` or omitted) the file is served inline so the browser ' +
      'can render it — e.g. images and PDFs. The response is the raw file, not the JSON envelope.',
  })
  @ApiQuery({
    name: 'download',
    required: false,
    type: Boolean,
    description: 'true = download as attachment; false/omitted = serve inline',
  })
  @ApiProduces('application/octet-stream')
  @ApiOkResponse({
    description: 'Binary file stream (inline or as an attachment).',
    schema: { type: 'string', format: 'binary' },
  })
  // A file id always points to the same content (every upload gets a new id),
  // so browsers and proxies can cache it indefinitely.
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetFileQueryDto,
    @User() user: IUserSession | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.filesService.getFile(id, query, user, ip);

    // Nest pipes the MinIO stream into the response but never destroys it when the
    // client disconnects early (e.g. the browser cancels an image load). The
    // abandoned stream then keeps its MinIO socket and buffered data forever —
    // thousands of these exhausted the kernel's TCP memory and made every
    // connection on the host crawl. Destroying it on close releases the socket;
    // after a normal finish this is a no-op.
    res.once('close', () => file.getStream().destroy());
    return file;
  }
}
