import { Inject, Injectable } from '@nestjs/common';
import { STEP_HANDLERS } from './jobs.constants';
import { IStepHandler } from './interfaces/step-handler.interface';

/**
 * Resolves an {@link IStepHandler} by its step `type`. Handlers are supplied as a
 * single array via the `STEP_HANDLERS` token (see JobsModule) and indexed once
 * at construction — no manual registration calls, no `onModuleInit` side effects.
 */
@Injectable()
export class StepRegistryService {
  private readonly handlers: Map<string, IStepHandler>;

  constructor(@Inject(STEP_HANDLERS) handlers: IStepHandler[]) {
    this.handlers = new Map(handlers.map((handler) => [handler.type, handler]));
  }

  get(type: string): IStepHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  /** Step types that have a registered handler — useful for validating input. */
  get types(): string[] {
    return [...this.handlers.keys()];
  }
}
