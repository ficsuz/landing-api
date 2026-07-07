import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, Prisma, StepStatus } from '@prisma/client';

export class JobStepResponseDto {
  @ApiProperty({ example: '018f3a2b-7c4d-7e8f-9a0b-1c2d3e4f5a6b', description: 'Step identifier' })
  id: string;

  @ApiProperty({ example: 'website_loading', description: 'Application-defined step type' })
  type: string;

  @ApiProperty({
    enum: StepStatus,
    example: StepStatus.PENDING,
    description: 'Current step status',
  })
  status: StepStatus;

  @ApiProperty({ example: 1, description: 'Position of the step within the run (1-based)' })
  stepNumber: number;

  @ApiProperty({ example: 0, description: 'Number of execution attempts made so far' })
  attempts: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Handler output once the step completes',
  })
  result: Prisma.JsonValue;

  @ApiProperty({ type: String, nullable: true, description: 'Failure reason when the step failed' })
  error: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startedAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt: Date | null;
}

export class JobResponseDto {
  @ApiProperty({ example: '018f3a2b-7c4d-7e8f-9a0b-1c2d3e4f5a6b', description: 'Job identifier' })
  id: string;

  @ApiProperty({ example: 'pipeline', description: 'Application-defined pipeline type' })
  type: string;

  @ApiProperty({ enum: JobStatus, example: JobStatus.PENDING, description: 'Overall run status' })
  status: JobStatus;

  @ApiProperty({ example: 3, description: 'Total number of steps in the run' })
  totalSteps: number;

  @ApiProperty({ example: 1, description: 'Step number currently in flight (0 = not started)' })
  currentStep: number;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description: 'Final result of the run (the last step’s output)',
  })
  result: Prisma.JsonValue;

  @ApiProperty({ type: String, nullable: true, description: 'Failure reason when the run failed' })
  error: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startedAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: [JobStepResponseDto], description: 'Steps ordered by step number' })
  steps: JobStepResponseDto[];
}
