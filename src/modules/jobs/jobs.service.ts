import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobStatus, Prisma, StepStatus } from '@prisma/client';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { PaginationDto } from '@common/dto/pagination.dto';
import { paginate } from '@common/utils/api-response.util';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { StepRegistryService } from './step-registry.service';
import { CreateJobDto } from './dto/create-job.dto';
import { DEFAULT_JOB_TYPE, JOB_QUEUE_NAME, PROCESS_STEP_JOB } from './jobs.constants';
import { IJobStepPayload } from './interfaces/step-handler.interface';

// Shaped output for every job-returning endpoint — never leaks internal payloads
// beyond what the response DTO documents.
const JOB_SELECT = {
  id: true,
  type: true,
  status: true,
  totalSteps: true,
  currentStep: true,
  result: true,
  error: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
  steps: {
    orderBy: { stepNumber: 'asc' },
    select: {
      id: true,
      type: true,
      status: true,
      stepNumber: true,
      attempts: true,
      result: true,
      error: true,
      startedAt: true,
      completedAt: true,
    },
  },
} satisfies Prisma.JobsSelect;

/**
 * Orchestrates pipeline jobs: it writes the run + its steps, enqueues work, and
 * exposes read/retry endpoints. It does NOT run handlers — that is the
 * `JobsProcessor`'s job (steps execute off the BullMQ queue, never in-request).
 */
@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stepRegistry: StepRegistryService,
    @InjectQueue(JOB_QUEUE_NAME) private readonly queue: Queue<IJobStepPayload>,
  ) {}

  /**
   * Create a job from an ordered list of step types and enqueue the first step.
   * All step rows are written up front (PENDING); the chain advances itself as
   * each step completes.
   */
  async createJob(dto: CreateJobDto, userId: string) {
    // Fail fast: every requested step must map to a registered handler.
    const unknownStep = dto.steps.find((type) => !this.stepRegistry.has(type));
    if (unknownStep) {
      throw new AppException(ErrorCodes.INVALID_STEP_TYPE, { details: { stepType: unknownStep } });
    }

    const job = await this.prisma.jobs.create({
      data: {
        type: dto.type ?? DEFAULT_JOB_TYPE,
        payload: dto.data ?? {},
        totalSteps: dto.steps.length,
        userId,
        steps: {
          create: dto.steps.map((type, index) => ({ type, stepNumber: index + 1 })),
        },
      },
      select: JOB_SELECT,
    });

    const firstStep = job.steps[0];
    await this.enqueueStep(job.id, firstStep.id);

    return job;
  }

  /** Enqueue a single step for background processing (used to start + advance runs). */
  async enqueueStep(jobId: string, stepId: string): Promise<void> {
    await this.queue.add(PROCESS_STEP_JOB, { jobId, stepId });
  }

  async findAll({ page = 1, limit = 10, search }: PaginationDto) {
    const where: Prisma.JobsWhereInput = search
      ? { type: { contains: search, mode: 'insensitive' } }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.jobs.findMany({
        where,
        select: JOB_SELECT,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.jobs.count({ where }),
    ]);
    return paginate(rows, total, page, limit);
  }

  async findById(id: string) {
    const job = await this.prisma.jobs.findUnique({ where: { id }, select: JOB_SELECT });
    if (!job) {
      throw new AppException(ErrorCodes.JOB_NOT_FOUND, { details: { id } });
    }
    return job;
  }

  /**
   * Retry a failed run: reset the failed step to PENDING, reopen the job, and
   * re-enqueue that step so the chain resumes from where it stopped.
   */
  async retryJob(id: string) {
    const job = await this.prisma.jobs.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
    if (!job) {
      throw new AppException(ErrorCodes.JOB_NOT_FOUND, { details: { id } });
    }
    if (job.status !== JobStatus.FAILED) {
      throw new AppException(ErrorCodes.INVALID_OPERATION, { details: { id } });
    }

    const failedStep = job.steps.find((step) => step.status === StepStatus.FAILED);
    if (!failedStep) {
      throw new AppException(ErrorCodes.INVALID_OPERATION, { details: { id } });
    }

    await this.prisma.$transaction([
      this.prisma.jobSteps.update({
        where: { id: failedStep.id },
        data: {
          status: StepStatus.PENDING,
          attempts: 0,
          error: null,
          result: Prisma.JsonNull,
          startedAt: null,
          completedAt: null,
        },
      }),
      this.prisma.jobs.update({
        where: { id },
        data: {
          status: JobStatus.PROCESSING,
          error: null,
          currentStep: failedStep.stepNumber,
          completedAt: null,
        },
      }),
    ]);

    await this.enqueueStep(id, failedStep.id);

    return this.findById(id);
  }
}
