import { PaginationOrder } from '@common/dto/pagination.dto';

export interface IPagination {
  page?: number; // Page number (1-based)
  limit?: number; // Number of items per page
  search?: string; // Search term
  sortBy?: string; // Field to sort by
  order?: PaginationOrder; // Sort order (asc/desc)
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/**
 * The shape a service returns for a paginated list. The global
 * TransformInterceptor lifts `pagination` into the response `meta` and sets
 * the envelope `data` to `data` — so services never build the HTTP envelope.
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}
