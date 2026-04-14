export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export const successResult = <T>(data: T): ServiceResult<T> => ({
  data,
  error: null,
  success: true
});

export const errorResult = <T>(error: string, data: T | null = null): ServiceResult<T> => ({
  data,
  error,
  success: false
});

export type AsyncServiceResult<T> = Promise<ServiceResult<T>>;