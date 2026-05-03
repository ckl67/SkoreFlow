interface PaginatedResponse<T> {
  limit: number;
  page: number;
  sort?: string;
  total_rows: number;
  total_pages: number;
  rows: T[];
}

export { PaginatedResponse };
