import { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'admin' | 'sales_manager' | 'sales_rep';
  firstName?: string | null;
  lastName?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response> | void | Response;

export interface PaginationQuery {
  page?: string;
  limit?: string;
  offset?: string;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface SearchQuery {
  search?: string;
  q?: string;
}

export interface SortQuery {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type CommonQueryParams = PaginationQuery & DateRangeQuery & SearchQuery & SortQuery;
