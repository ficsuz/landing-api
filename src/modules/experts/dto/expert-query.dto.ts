import { ApiPropertyOptional } from '@nestjs/swagger';
import { ExpertType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from '@common/dto/pagination.dto';

export class ExpertQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ExpertType,
    description: 'Filter by feed: INTERNATIONAL (advisory group), UZBEK, or LOCAL',
  })
  @IsEnum(ExpertType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  type?: ExpertType;
}
