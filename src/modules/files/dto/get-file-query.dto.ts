import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GetFileQueryDto {
  @ApiPropertyOptional({
    description:
      'How to deliver the file. `true` forces an attachment download; `false` (default) serves it inline so browsers can render it (e.g. images, PDFs).',
    default: false,
    example: false,
  })
  @IsOptional()
  // Query params arrive as strings; coerce explicitly (class-transformer's
  // implicit boolean conversion treats any non-empty string as true).
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  download?: boolean = false;
}
