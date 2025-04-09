import { AxiosError, AxiosResponse } from 'axios';
import { BaseApiService } from './baseService';
import apiClient from '../config/axiosConfig';
import { ApiResponse, Appointment, PaginatedResponse } from '../types';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';

// Flag to control whether to use Firebase fallback
// Temporarily re-enabled to prevent network errors until backend is fully deployed
const USE_FIREBASE_FALLBACK = true;

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
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK) {
        console.log('API error, falling back to Firebase for doctor appointments');
        const appointments = await this.getAppointmentsByDoctorFromFirebase(doctorId, status);
        return this.createPaginatedResponse(appointments, page, limit);
      } else {
        this.handleError(error as AxiosError);
        return null;
      }
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
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK) {
        console.log('API error, falling back to Firebase for patient appointments');
        const appointments = await this.getAppointmentsByPatientFromFirebase(patientId, status);
        return this.createPaginatedResponse(appointments, page, limit);
      } else {
        this.handleError(error as AxiosError);
        return null;
      }
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

  /**
   * Helper method to get appointments from Firebase by doctor ID
   */
  private async getAppointmentsByDoctorFromFirebase(doctorId: string, status?: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, 'appointments');
      let q = query(appointmentsRef, where('doctorId', '==', doctorId));
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      
      querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      
      return appointments;
    } catch (error) {
      console.error('Firebase error:', error);
      return [];
    }
  }

  /**
   * Helper method to get appointments from Firebase by patient ID
   */
  private async getAppointmentsByPatientFromFirebase(patientId: string, status?: string): Promise<Appointment[]> {
    try {
      const appointmentsRef = collection(db, 'appointments');
      let q = query(appointmentsRef, where('patientId', '==', patientId));
      
      if (status) {
        q = query(q, where('status', '==', status));
      }
      
      const querySnapshot = await getDocs(q);
      const appointments: Appointment[] = [];
      
      querySnapshot.forEach((doc) => {
        appointments.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      
      return appointments;
    } catch (error) {
      console.error('Firebase error:', error);
      return [];
    }
  }

  /**
   * Helper to create a paginated response from an array of appointments
   */
  private createPaginatedResponse(appointments: Appointment[], page: number, limit: number): PaginatedResponse<Appointment> {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = appointments.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      total: appointments.length,
      page,
      limit,
      totalPages: Math.ceil(appointments.length / limit)
    };
  }
}
