export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  status?: 401 | 403 | 429 | 500 | number;
  message: string;
  fieldErrors?: unknown;
}

export type Identifier = number;

export type ResourceRow = Record<string, unknown>;
