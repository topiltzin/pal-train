import type { ErrorCode } from "@/lib/api/error-codes";

export type PagingMeta = { total: number; limit: number; offset: number };

export type ApiError = { code: ErrorCode; message: string };

export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: PagingMeta | null;
};

export function ok<T>(data: T, meta: PagingMeta | null = null): ApiEnvelope<T> {
  return { success: true, data, error: null, meta };
}

export function fail(code: ErrorCode, message: string): ApiEnvelope<null> {
  return { success: false, data: null, error: { code, message }, meta: null };
}
