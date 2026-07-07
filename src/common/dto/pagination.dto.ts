import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export enum PaginationOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @Max(100, { message: i18nValidationMessage('validation.MAX') })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
  })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: PaginationOrder,
    default: PaginationOrder.DESC,
  })
  @IsEnum(PaginationOrder, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  order?: PaginationOrder = PaginationOrder.DESC;
}
