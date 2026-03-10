export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string | string[]>;
}
