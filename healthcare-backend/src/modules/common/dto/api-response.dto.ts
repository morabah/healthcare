/**
 * Standard API response format
 */
export class ApiResponseDto<T> {
  success: boolean;
  message?: string;
  data: T;

  constructor(data: T, success = true, message?: string) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto<T>(data, true, message);
  }

  static error<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto<T>(data, false, message);
  }
}
