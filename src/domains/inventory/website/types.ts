import { BaseFilter, BaseSort, BasePagination } from 'src/common/interfaces/types';
import { ContextEnum } from '../context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';

export interface WebsiteFilter extends BaseFilter {
  searchTerm?: string;
  baseUrl?: string;
}

export interface WebsiteSort extends BaseSort {
  title?: 'ASC' | 'DESC';
  score?: 'ASC' | 'DESC';
  createdAt?: 'ASC' | 'DESC';
  updatedAt?: 'ASC' | 'DESC';
  createdBy?: 'ASC' | 'DESC';
}

export interface WebsitePagination extends BasePagination {}

export type WebsiteQueryRequest = {
  filters?: Partial<WebsiteFilter>;
  sortings?: Partial<WebsiteSort>;
  pagination?: Partial<WebsitePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};
