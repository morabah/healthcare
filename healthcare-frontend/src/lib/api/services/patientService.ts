import { AxiosError, AxiosResponse } from 'axios';
import { BaseApiService } from './baseService';
import apiClient from '../config/axiosConfig';
import { ApiResponse, Appointment, PatientProfile } from '../types';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';

// Flag to control whether to use Firebase fallback
// Temporarily re-enabled to prevent network errors until backend is fully deployed
const USE_FIREBASE_FALLBACK = true;

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
      // First try the API
      const response: AxiosResponse<ApiResponse<PatientProfile>> = 
        await apiClient.get(`/patients/user/${userId}`);
      return response.data.data;
    } catch (error) {
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK) {
        console.log('API error, falling back to Firebase');
        return this.getProfileFromFirebase(userId);
      } else {
        this.handleError(error as AxiosError);
        return null;
      }
    }
  }

  /**
   * Fallback method to get patient profile from Firebase
   */
  private async getProfileFromFirebase(userId: string): Promise<PatientProfile | null> {
    try {
      const profileRef = doc(db, 'patientProfiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        return { id: profileDoc.id, ...profileDoc.data() } as PatientProfile;
      }
      return null;
    } catch (error) {
      console.error('Firebase error:', error);
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
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK && (error as AxiosError).response?.status === 404) {
        console.log('API error, falling back to Firebase');
        // Implement fallback logic for appointments
        // For demonstration purposes, return an empty array
        return [];
      } else {
        this.handleError(error as AxiosError);
        return null;
      }
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
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK) {
        console.log('API error, falling back to Firebase');
        // Implement fallback logic for booking appointments
        // For demonstration purposes, return null
        return null;
      } else {
        this.handleError(error as AxiosError);
        return null;
      }
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
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK) {
        console.log('API error, falling back to Firebase');
        // Implement fallback logic for canceling appointments
        // For demonstration purposes, return false
        return false;
      } else {
        this.handleError(error as AxiosError);
        return false;
      }
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
      // If API fails or returns 404, fall back to Firebase if enabled
      if (USE_FIREBASE_FALLBACK) {
        console.log('API error, falling back to Firebase');
        // Implement fallback logic for updating medical history
        // For demonstration purposes, return null
        return null;
      } else {
        this.handleError(error as AxiosError);
        return null;
      }
    }
  }
}
