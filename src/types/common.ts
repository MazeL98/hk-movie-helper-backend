export interface PaginatedResult<T> {
  data: T[] | null;
  total: number;
  pageNo: number;
  pageSize: number;
}