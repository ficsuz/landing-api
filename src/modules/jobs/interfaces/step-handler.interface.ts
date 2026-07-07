import { Prisma } from '@prisma/client';

// BullMQ job payload — intentionally tiny: identity only. Everything else
// (status, data, results) is read from the database when the step runs.
export interface IJobStepPayload {
  jobId: string;
  stepId: string;
}

// What a handler receives when its step executes.
export interface IStepContext {
  jobId: string;
  stepId: string;
  stepType: string;
  stepNumber: number;
  totalSteps: number;
  userId: string | null;
  payload: Prisma.JsonValue; // shared input for the whole run (Jobs.payload)
  data: Prisma.JsonValue; // this step's own input (JobSteps.data)
  previousResult: Prisma.JsonValue | null; // the prior step's output, for chaining
}

// A unit of work, registered under `type`. To add one: implement this interface
// and register the class in JobsModule (providers + the STEP_HANDLERS factory).
export interface IStepHandler {
  readonly type: string;
  execute(context: IStepContext): Promise<Prisma.InputJsonValue>;
}
