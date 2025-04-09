import { AxiosError, AxiosResponse } from 'axios';
import { BaseApiService } from './baseService';
import apiClient from '../config/axiosConfig';
import { ApiResponse, Appointment, PaginatedResponse } from '../types';

/**
 * Service for appointment-related API endpoints
 */
export class AppointmentService extends BaseApiService<Appointment> {
  constructor() {
    super('appointments');
  }

  /**
   * Get appointments by doctor ID
   */
  async getByDoctorId(doctorId: string, status?: string, page = 1, limit = 10): Promise<PaginatedResponse<Appointment> | null> {
    try {
      const response: AxiosResponse<PaginatedResponse<Appointment>> = 
        await apiClient.get(`/appointments/doctor/${doctorId}`, {
          params: { status, page, limit }
        });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Get appointments by patient ID
   */
  async getByPatientId(patientId: string, status?: string, page = 1, limit = 10): Promise<PaginatedResponse<Appointment> | null> {
    try {
      const response: AxiosResponse<PaginatedResponse<Appointment>> = 
        await apiClient.get(`/appointments/patient/${patientId}`, {
          params: { status, page, limit }
        });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Update appointment status
   */
  async updateStatus(appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'): Promise<Appointment | null> {
    try {
      const response: AxiosResponse<ApiResponse<Appointment>> = 
        await apiClient.patch(`/appointments/${appointmentId}/status`, { status });
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Add medical notes to an appointment
   */
  async addMedicalNotes(appointmentId: string, notes: {
    symptoms?: string;
    diagnosis?: string;
    prescription?: string;
    followUpDate?: string;
  }): Promise<Appointment | null> {
    try {
      const response: AxiosResponse<ApiResponse<Appointment>> = 
        await apiClient.patch(`/appointments/${appointmentId}/medical-notes`, notes);
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }
}
