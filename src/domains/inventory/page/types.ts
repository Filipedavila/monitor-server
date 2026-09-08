import { BaseFilter, BasePagination, BaseSort, SortCriteria } from 'src/common/interfaces/types';
import { Context } from '../context/context.identity';
import { ContextEnum } from '../context/context.enum';
import { SecurityContext } from 'src/core/authentication/interfaces/types';

export interface PageFilter extends BaseFilter {
  url?: string;
  websiteId?: number;
  contexts?: Context[];
}

export interface PageSort extends BaseSort {
  url?: SortCriteria;
  createdAt?: SortCriteria;
  score?: SortCriteria;
}

export type PageQueryRequest = {
  filters: Partial<PageFilter>;
  sortings: Partial<PageSort>;
  pagination: Partial<BasePagination>;
  contexts: ContextEnum[];
  securityContext: SecurityContext;
};
export interface PageRecord {
  url: string;
  urlHash: string;
}
export interface PagePagination extends BasePagination {}
