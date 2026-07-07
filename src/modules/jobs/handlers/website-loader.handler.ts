import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { STEP_TYPES } from '../jobs.constants';
import { IStepContext, IStepHandler } from '../interfaces/step-handler.interface';

/**
 * Demo step handler. A handler declares the `type` it serves and runs the work
 * for one step; its return value is persisted and forwarded to the next step.
 * Copy this shape for real handlers and register the class in JobsModule.
 */
@Injectable()
export class WebsiteLoaderHandler implements IStepHandler {
  readonly type = STEP_TYPES.WEBSITE_LOADING;
  private readonly logger = new Logger(WebsiteLoaderHandler.name);

  execute(context: IStepContext): Promise<Prisma.InputJsonValue> {
    this.logger.log(
      `Running step ${context.stepType} (#${context.stepNumber}/${context.totalSteps}) for job ${context.jobId}`,
    );

    // TODO: implement website loading; the demo handler returns a static result.
    return Promise.resolve({
      success: true,
      message: 'Website loaded and stored in RAG system successfully',
    });
  }
}
