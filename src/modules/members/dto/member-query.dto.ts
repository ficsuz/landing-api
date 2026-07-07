import { ApiPropertyOptional } from '@nestjs/swagger';
import { MemberType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from '@common/dto/pagination.dto';

export class MemberQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: MemberType,
    description: 'Filter by membership category: EXECUTIVE_BOARD, FULL, or OBSERVER',
  })
  @IsEnum(MemberType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  type?: MemberType;
}
