import { AxiosError, AxiosResponse } from 'axios';
import { BaseApiService } from './baseService';
import apiClient from '../config/axiosConfig';
import { ApiResponse, Appointment, PatientProfile } from '../types';

/**
 * Service for patient-related API endpoints
 */
export class PatientService extends BaseApiService<PatientProfile> {
  constructor() {
    super('patients');
  }

  /**
   * Get patient profile by user ID (Firebase UID)
   */
  async getProfileByUserId(userId: string): Promise<PatientProfile | null> {
    try {
      const response: AxiosResponse<ApiResponse<PatientProfile>> = 
        await apiClient.get(`/patients/user/${userId}`);
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Get patient's appointments
   */
  async getAppointments(patientId: string, status?: string): Promise<Appointment[] | null> {
    try {
      const response: AxiosResponse<ApiResponse<Appointment[]>> = 
        await apiClient.get(`/patients/${patientId}/appointments`, {
          params: { status }
        });
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Book an appointment with a doctor
   */
  async bookAppointment(patientId: string, appointmentData: Partial<Appointment>): Promise<Appointment | null> {
    try {
      const response: AxiosResponse<ApiResponse<Appointment>> = 
        await apiClient.post(`/patients/${patientId}/appointments`, appointmentData);
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(patientId: string, appointmentId: string): Promise<boolean> {
    try {
      await apiClient.patch(`/patients/${patientId}/appointments/${appointmentId}/cancel`);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }

  /**
   * Update medical history
   */
  async updateMedicalHistory(patientId: string, medicalHistory: string[]): Promise<PatientProfile | null> {
    try {
      const response: AxiosResponse<ApiResponse<PatientProfile>> = 
        await apiClient.patch(`/patients/${patientId}/medical-history`, { medicalHistory });
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }
}
