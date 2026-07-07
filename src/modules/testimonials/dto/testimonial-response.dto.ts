import { ApiProperty } from '@nestjs/swagger';

export class TestimonialResponseDto {
  @ApiProperty({ example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b', description: 'Testimonial ID' })
  id: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Author full name', nullable: true })
  fullName: string | null;

  @ApiProperty({
    example: 'Chief Technology Officer',
    description: 'Author position',
    nullable: true,
  })
  position: string | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Caption image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  captionId: string | null;

  @ApiProperty({
    example: '018f1a2b-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Logo image file id (fetch via GET /files/:id)',
    nullable: true,
  })
  logoId: string | null;

  @ApiProperty({
    example: 'https://youtu.be/dQw4w9WgXcQ',
    description: 'Video source URL',
    nullable: true,
  })
  videoSource: string | null;

  @ApiProperty({ example: 0, description: 'Display order (ascending)' })
  order: number;

  @ApiProperty({ example: true, description: 'Published flag' })
  status: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z', description: 'Creation timestamp' })
  createdAt: Date;
}
