// Base API configuration and utilities

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

interface ApiError {
  message: string;
  code: string;
}

export const apiClient = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    // TODO: wire data source
    console.log(`GET ${API_BASE_URL}${endpoint}`);
    return {
      data: [] as unknown as T,
      success: true,
    };
  },

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    // TODO: wire data source
    console.log(`POST ${API_BASE_URL}${endpoint}`, body);
    return {
      data: {} as T,
      success: true,
    };
  },

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    // TODO: wire data source
    console.log(`PUT ${API_BASE_URL}${endpoint}`, body);
    return {
      data: {} as T,
      success: true,
    };
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    // TODO: wire data source
    console.log(`DELETE ${API_BASE_URL}${endpoint}`);
    return {
      data: {} as T,
      success: true,
    };
  },
};

export const handleApiError = (error: ApiError): string => {
  // TODO: implement error handling
  return error.message || 'An unexpected error occurred';
};

export type { ApiResponse, ApiError };
