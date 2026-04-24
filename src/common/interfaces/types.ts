export type SortCriteria = "ASC" | "DESC";

export interface BaseFilter {
  ids?: number[] | string[];
}

export interface BaseSort {
  id?: SortCriteria;
}

export interface BasePagination {
  page?: number;
  limit?: number;
}
