import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from '@common/dto/pagination.dto';

export class DocumentQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Filter by category id (the selected tab)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  categoryId?: string;
}
