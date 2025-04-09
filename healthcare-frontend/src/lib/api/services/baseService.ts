import { AxiosError, AxiosResponse } from 'axios';
import apiClient from '../config/axiosConfig';

/**
 * Base API service with common CRUD operations
 */
export class BaseApiService<T> {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /**
   * Get all resources
   */
  async getAll(): Promise<T[]> {
    try {
      const response: AxiosResponse<T[]> = await apiClient.get(`/${this.basePath}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return [];
    }
  }

  /**
   * Get resource by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await apiClient.get(`/${this.basePath}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Create a new resource
   */
  async create(data: Partial<T>): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(`/${this.basePath}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Update an existing resource
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await apiClient.put(`/${this.basePath}/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Patch an existing resource
   */
  async patch(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const response: AxiosResponse<T> = await apiClient.patch(`/${this.basePath}/${id}`, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Delete a resource
   */
  async delete(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/${this.basePath}/${id}`);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  /**
   * Handle API errors
   */
  protected handleError(error: AxiosError): void {
    // Additional custom error handling if needed
    // The global interceptor in axiosConfig already handles common errors
    throw error;
  }
}
