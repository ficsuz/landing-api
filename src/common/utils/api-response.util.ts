import {
  IApiError,
  IApiResponse,
  IPaginationMeta,
} from '@common/interfaces/api-response.interface';
import { PaginatedResult } from '@common/interfaces/pagination.interface';

/**
 * Build a `PaginatedResult` for a list endpoint. Return this from a service; the
 * global `TransformInterceptor` lifts `pagination` into the response `meta`.
 * This is the one canonical pagination helper.
 */
export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const safeLimit = Math.max(1, limit);
  const lastPage = Math.max(1, Math.ceil(total / safeLimit));

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      lastPage,
      hasPrev: page > 1,
      hasNext: page < lastPage,
    },
  };
}

interface BaseResponseInput {
  path: string;
  requestId?: string;
}

/**
 * Build the success envelope. Used by the `TransformInterceptor` for every
 * non-error handler return value — controllers/services never call this.
 */
export function buildSuccessResponse<T>(
  data: T,
  input: BaseResponseInput & { message?: string; pagination?: IPaginationMeta },
): IApiResponse<T> {
  return {
    success: true,
    message: input.message ?? 'Operation successful',
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      path: input.path,
      requestId: input.requestId,
      pagination: input.pagination,
    },
  };
}

/**
 * Build the error envelope. Used only by the `HttpExceptionFilter`. Shares the
 * exact shape of the success envelope so clients parse a single contract.
 */
export function buildErrorResponse(
  input: BaseResponseInput & { message: string; error: IApiError },
): IApiResponse<null> {
  return {
    success: false,
    message: input.message,
    data: null,
    error: input.error,
    meta: {
      timestamp: new Date().toISOString(),
      path: input.path,
      requestId: input.requestId,
    },
  };
}
