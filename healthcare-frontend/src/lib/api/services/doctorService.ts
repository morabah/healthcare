import { AxiosError, AxiosResponse } from 'axios';
import { BaseApiService } from './baseService';
import apiClient from '../config/axiosConfig';
import { ApiResponse, DoctorProfile, PaginatedResponse } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';

// Flag to control whether to use Firebase fallback
// Temporarily re-enabled to prevent network errors until backend is fully deployed
const USE_FIREBASE_FALLBACK = true;

/**
 * Service for doctor-related API endpoints
 */
export class DoctorService extends BaseApiService<DoctorProfile> {
  constructor() {
    super('doctors');
  }

  /**
   * Get doctor profile by user ID (Firebase UID)
   */
  async getProfileByUserId(userId: string): Promise<DoctorProfile | null> {
    try {
      // First try the API
      const response: AxiosResponse<ApiResponse<DoctorProfile>> = 
        await apiClient.get(`/doctors/user/${userId}`);
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
   * Fallback method to get doctor profile from Firebase
   */
  private async getProfileFromFirebase(userId: string): Promise<DoctorProfile | null> {
    try {
      const profileRef = doc(db, 'doctorProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        return {
          id: profileSnap.id,
          userId: userId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          specialty: data.specialty || '',
          location: data.location || '',
          languages: data.languages || '',
          yearsOfExperience: data.yearsOfExperience || '',
          education: data.education || '',
          professionalBio: data.professionalBio || '',
          consultationFee: data.consultationFee || '',
          profilePicture: data.profilePicture || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      }
      console.log('No existing doctor profile found for user', userId);
      return null;
    } catch (err) {
      console.warn('Error accessing Firebase doctor profile:', err);
      return null;
    }
  }

  /**
   * Create or update doctor profile
   * This method will try the API first, then fall back to Firebase if needed
   */
  async createOrUpdateProfile(userId: string, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | null> {
    if (USE_FIREBASE_FALLBACK) {
      try {
        // First try the API
        if (profileData.id) {
          const response = await apiClient.put(`/doctors/${profileData.id}`, profileData);
          return response.data.data;
        } else {
          const response = await apiClient.post('/doctors', {
            ...profileData,
            userId
          });
          return response.data.data;
        }
      } catch (error) {
        console.log('API not available, falling back to Firebase');
        // Fallback to Firebase if API fails
        return this.saveProfileToFirebase(userId, profileData);
      }
    } else {
      try {
        if (profileData.id) {
          const response = await this.update(profileData.id, profileData);
          return response;
        } else {
          const response = await this.create({
            ...profileData,
            userId
          });
          return response;
        }
      } catch (error) {
        this.handleError(error as AxiosError);
        return null;
      }
    }
  }

  /**
   * Fallback method to save doctor profile to Firebase
   */
  private async saveProfileToFirebase(userId: string, profileData: Partial<DoctorProfile>): Promise<DoctorProfile | null> {
    try {
      const profileRef = doc(db, 'doctorProfiles', userId);
      
      // Add timestamps
      const dataToSave = {
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      // If it's a new profile, add createdAt
      const profileSnap = await getDoc(profileRef);
      if (!profileSnap.exists()) {
        dataToSave.createdAt = new Date().toISOString();
      }
      
      await setDoc(profileRef, dataToSave, { merge: true });
      
      // Get the updated document
      const updatedSnap = await getDoc(profileRef);
      if (updatedSnap.exists()) {
        const data = updatedSnap.data();
        return {
          id: updatedSnap.id,
          userId: userId,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          specialty: data.specialty || '',
          location: data.location || '',
          languages: data.languages || '',
          yearsOfExperience: data.yearsOfExperience || '',
          education: data.education || '',
          professionalBio: data.professionalBio || '',
          consultationFee: data.consultationFee || '',
          profilePicture: data.profilePicture || '',
          createdAt: data.createdAt || '',
          updatedAt: data.updatedAt || ''
        };
      }
      return null;
    } catch (err) {
      console.error('Error saving profile to Firebase:', err);
      return null;
    }
  }

  /**
   * Search for doctors by specialty
   */
  async searchBySpecialty(specialty: string, page = 1, limit = 10): Promise<PaginatedResponse<DoctorProfile> | null> {
    try {
      const response: AxiosResponse<PaginatedResponse<DoctorProfile>> = 
        await apiClient.get(`/doctors/search`, {
          params: { specialty, page, limit }
        });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Search for doctors by location
   */
  async searchByLocation(location: string, page = 1, limit = 10): Promise<PaginatedResponse<DoctorProfile> | null> {
    try {
      const response: AxiosResponse<PaginatedResponse<DoctorProfile>> = 
        await apiClient.get(`/doctors/search`, {
          params: { location, page, limit }
        });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Get doctor availability slots
   */
  async getAvailability(doctorId: string, date?: string): Promise<any | null> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = 
        await apiClient.get(`/doctors/${doctorId}/availability`, {
          params: { date }
        });
      return response.data.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Update doctor availability
   */
  async updateAvailability(doctorId: string, availabilityData: any): Promise<boolean> {
    try {
      await apiClient.post(`/doctors/${doctorId}/availability`, availabilityData);
      return true;
    } catch (error) {
      this.handleError(error as AxiosError);
      return false;
    }
  }
}
