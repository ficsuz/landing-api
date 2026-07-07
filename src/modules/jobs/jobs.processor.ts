import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JobStatus, JobSteps, StepStatus } from '@prisma/client';
import { PrismaService } from '@common/services/prisma/prisma.service';
import { WebsocketsGateway } from '@common/services/socket-gateway/websockets.gateway';
import { AppException } from '@common/exceptions/app.exception';
import { ErrorCodes } from '@common/constants/error-codes';
import { StepRegistryService } from './step-registry.service';
import { JobsService } from './jobs.service';
import { JOB_QUEUE_NAME } from './jobs.constants';
import { IJobStepPayload, IStepContext } from './interfaces/step-handler.interface';

/**
 * BullMQ worker for the step pipeline. Each queue job runs exactly one step:
 * it marks the step PROCESSING, runs the handler, persists the result, then
 * enqueues the next step (or completes the run). Throwing lets BullMQ apply the
 * configured retry/backoff; a step is only marked FAILED once attempts run out
 * (see {@link onFailed}).
 */
@Processor(JOB_QUEUE_NAME)
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stepRegistry: StepRegistryService,
    private readonly jobsService: JobsService,
    private readonly gateway: WebsocketsGateway,
  ) {
    super();
  }

  async process(job: Job<IJobStepPayload>): Promise<void> {
    const { jobId, stepId } = job.data;

    const step = await this.prisma.jobSteps.findUnique({
      where: { id: stepId },
      include: { job: true },
    });
    if (!step) {
      throw new AppException(ErrorCodes.STEP_NOT_FOUND, { details: { stepId } });
    }

    const handler = this.stepRegistry.get(step.type);
    if (!handler) {
      throw new AppException(ErrorCodes.INVALID_STEP_TYPE, {
        details: { stepId, stepType: step.type },
      });
    }

    // Mark the run + this step as in-flight (attempt count is 1-based for clients).
    await this.prisma.jobs.update({
      where: { id: jobId },
      data: {
        status: JobStatus.PROCESSING,
        currentStep: step.stepNumber,
        startedAt: step.job.startedAt ?? new Date(),
      },
    });
    const processing = await this.prisma.jobSteps.update({
      where: { id: stepId },
      data: {
        status: StepStatus.PROCESSING,
        attempts: job.attemptsMade + 1,
        startedAt: new Date(),
      },
    });
    this.emit(step.job.userId, jobId, processing);

    // Chain the previous step's output into this step's context.
    const previous =
      step.stepNumber > 1
        ? await this.prisma.jobSteps.findUnique({
            where: { jobId_stepNumber: { jobId, stepNumber: step.stepNumber - 1 } },
            select: { result: true },
          })
        : null;

    const context: IStepContext = {
      jobId,
      stepId,
      stepType: step.type,
      stepNumber: step.stepNumber,
      totalSteps: step.job.totalSteps,
      userId: step.job.userId,
      payload: step.job.payload,
      data: step.data,
      previousResult: previous?.result ?? null,
    };

    const result = await handler.execute(context);

    const completed = await this.prisma.jobSteps.update({
      where: { id: stepId },
      data: { status: StepStatus.COMPLETED, result, completedAt: new Date() },
    });
    this.emit(step.job.userId, jobId, completed);

    // Advance the chain: enqueue the next pending step, or finish the run.
    const next = await this.prisma.jobSteps.findFirst({
      where: { jobId, status: StepStatus.PENDING },
      orderBy: { stepNumber: 'asc' },
    });
    if (next) {
      await this.jobsService.enqueueStep(jobId, next.id);
      return;
    }

    await this.prisma.jobs.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        result,
        currentStep: step.job.totalSteps,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Fires after every failed attempt. Non-final attempts will be retried by
   * BullMQ, so we only halt the run (mark step + job FAILED) once the configured
   * attempts are exhausted.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<IJobStepPayload>, error: Error): Promise<void> {
    const { jobId, stepId } = job.data;
    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade < maxAttempts) {
      this.logger.warn(
        `Step ${stepId} attempt ${job.attemptsMade}/${maxAttempts} failed: ${error.message}`,
      );
      return;
    }

    const step = await this.prisma.jobSteps.update({
      where: { id: stepId },
      data: {
        status: StepStatus.FAILED,
        attempts: job.attemptsMade,
        error: error.message,
        completedAt: new Date(),
      },
      include: { job: { select: { userId: true } } },
    });
    await this.prisma.jobs.update({
      where: { id: jobId },
      data: { status: JobStatus.FAILED, error: error.message },
    });

    this.emit(step.job.userId, jobId, step);
    this.logger.error(`Job ${jobId} halted: step ${stepId} failed — ${error.message}`);
  }

  /** Push a step status change to the owner's WebSocket room. */
  private emit(userId: string | null, jobId: string, step: JobSteps): void {
    if (!userId) {
      return;
    }
    this.gateway.emitToProcessingQueue(userId, {
      jobId,
      stepId: step.id,
      stepType: step.type,
      stepNumber: step.stepNumber,
      status: step.status,
    });
  }
}
