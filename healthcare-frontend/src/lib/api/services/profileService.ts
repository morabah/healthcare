import { AxiosResponse } from 'axios';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';
import apiClient from '../config/axiosConfig';
import { HybridStorage } from '@/lib/storage/hybridStorage';

// Cache TTL constants
const SHORT_TTL = 60 * 1000; // 1 minute
const MEDIUM_TTL = 5 * 60 * 1000; // 5 minutes
const LONG_TTL = 60 * 60 * 1000; // 1 hour

export interface PatientProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalConditions: string;
  allergies: string;
  medications: string;
  bloodType: string;
}

export class ProfileService {
  private USE_FIREBASE_FALLBACK = true;
  private storage: HybridStorage;

  constructor() {
    // Only initialize storage in browser environment
    if (typeof window !== 'undefined') {
      this.storage = new HybridStorage('profiles');
    } else {
      // Provide fallback for SSR
      this.storage = {
        get: async () => null,
        set: async () => {},
        delete: async () => {}
      } as unknown as HybridStorage;
    }
  }

  /**
   * Get a patient profile by user ID with optimized caching
   */
  async getPatientProfile(userId: string): Promise<PatientProfile> {
    // Return from cache if available
    const cachedProfile = await this.storage.get<PatientProfile>(`patient_${userId}`);
    if (cachedProfile) {
      return cachedProfile;
    }
    
    try {
      // Attempt API request with a short timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const response: AxiosResponse<PatientProfile> = await apiClient.get(
        `/patients/profile/${userId}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      // Cache the response with a medium TTL
      await this.storage.set(`patient_${userId}`, response.data, MEDIUM_TTL);
      
      return response.data;
    } catch (error) {
      // Fall back to Firebase if API fails or doesn't exist yet
      if (this.USE_FIREBASE_FALLBACK) {
        console.log('Falling back to Firebase for patient profile');
        
        const profileRef = doc(db, 'patientProfiles', userId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as PatientProfile;
          
          // Cache the Firebase response
          await this.storage.set(`patient_${userId}`, profileData, MEDIUM_TTL);
          
          return profileData;
        }
        
        // Return empty profile if not found
        return {
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: '',
          phoneNumber: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          medicalConditions: '',
          allergies: '',
          medications: '',
          bloodType: '',
        };
      }
      
      // Rethrow if no fallback
      throw error;
    }
  }
  
  /**
   * Get a doctor profile by user ID with optimized caching
   */
  async getDoctorProfile(userId: string): Promise<any> {
    // Return from cache if available
    const cachedProfile = await this.storage.get<any>(`doctor_${userId}`);
    if (cachedProfile) {
      return cachedProfile;
    }
    
    try {
      // Attempt API request with a short timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      
      const response: AxiosResponse<any> = await apiClient.get(
        `/doctors/profile/${userId}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      // Cache the response with a medium TTL
      await this.storage.set(`doctor_${userId}`, response.data, MEDIUM_TTL);
      
      return response.data;
    } catch (error) {
      // Fall back to Firebase if API fails or doesn't exist yet
      if (this.USE_FIREBASE_FALLBACK) {
        console.log('Falling back to Firebase for doctor profile');
        
        const profileRef = doc(db, 'doctorProfiles', userId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data();
          
          // Cache the Firebase response
          await this.storage.set(`doctor_${userId}`, profileData, MEDIUM_TTL);
          
          return profileData;
        }
        
        // Return empty profile if not found
        return {};
      }
      
      // Rethrow if no fallback
      throw error;
    }
  }
  
  /**
   * Update a patient profile with optimistic updates
   */
  async updatePatientProfile(userId: string, profile: PatientProfile): Promise<PatientProfile> {
    try {
      // Attempt API request
      const response: AxiosResponse<PatientProfile> = await apiClient.put(
        `/patients/profile/${userId}`,
        profile
      );
      
      // Update cache
      await this.storage.set(`patient_${userId}`, response.data, MEDIUM_TTL);
      
      return response.data;
    } catch (error) {
      // Fall back to Firebase if API fails or doesn't exist yet
      if (this.USE_FIREBASE_FALLBACK) {
        console.log('Falling back to Firebase for patient profile update');
        
        const profileRef = doc(db, 'patientProfiles', userId);
        await setDoc(profileRef, profile, { merge: true });
        
        // Update cache
        await this.storage.set(`patient_${userId}`, profile, MEDIUM_TTL);
        
        return profile;
      }
      
      // Rethrow if no fallback
      throw error;
    }
  }
  
  /**
   * Update a doctor profile with optimistic updates
   */
  async updateDoctorProfile(userId: string, profile: any): Promise<any> {
    try {
      // Attempt API request
      const response: AxiosResponse<any> = await apiClient.put(
        `/doctors/profile/${userId}`,
        profile
      );
      
      // Update cache
      await this.storage.set(`doctor_${userId}`, response.data, MEDIUM_TTL);
      
      return response.data;
    } catch (error) {
      // Fall back to Firebase if API fails or doesn't exist yet
      if (this.USE_FIREBASE_FALLBACK) {
        console.log('Falling back to Firebase for doctor profile update');
        
        const profileRef = doc(db, 'doctorProfiles', userId);
        await setDoc(profileRef, profile, { merge: true });
        
        // Update cache
        await this.storage.set(`doctor_${userId}`, profile, MEDIUM_TTL);
        
        return profile;
      }
      
      // Rethrow if no fallback
      throw error;
    }
  }
}

export const profileService = new ProfileService();
