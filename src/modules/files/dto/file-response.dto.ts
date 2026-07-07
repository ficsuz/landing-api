import { ApiProperty } from '@nestjs/swagger';

export class FileResponseDto {
  @ApiProperty({
    example: '018f3a2b-7c4d-7e8f-9a0b-1c2d3e4f5a6b',
    description: 'Unique file identifier',
  })
  id: string;

  @ApiProperty({
    example: 'invoice.pdf',
    description: 'Original file name',
  })
  name: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'File MIME type',
  })
  type: string;

  @ApiProperty({
    example: 102400,
    description: 'File size in bytes',
  })
  size: number;

  @ApiProperty({
    example: 'uploads',
    description: 'Object storage bucket the file is stored in',
  })
  bucketName: string;

  @ApiProperty({
    example: '2026-06-16T10:00:00.000Z',
    description: 'Timestamp when the file was created',
  })
  createdAt: Date;
}
