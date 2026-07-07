import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, IsUrl, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateTestimonialDto {
  @ApiPropertyOptional({ example: 'Jane Doe', description: 'Author full name' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Chief Technology Officer', description: 'Author position' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Caption image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  captionId?: string;

  @ApiPropertyOptional({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Logo image file id (references Files.id; fetch via GET /files/:id)',
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  @IsOptional()
  logoId?: string;

  @ApiPropertyOptional({ example: 'https://youtu.be/dQw4w9WgXcQ', description: 'Video source URL' })
  @IsUrl({}, { message: i18nValidationMessage('validation.IS_URL') })
  @IsOptional()
  videoSource?: string;

  @ApiPropertyOptional({ example: 0, description: 'Display order (ascending)', minimum: 0 })
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: true, description: 'Published flag' })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  @IsOptional()
  status?: boolean;
}
