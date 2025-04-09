import { AxiosError, AxiosResponse } from 'axios';
import { BaseApiService } from './baseService';
import apiClient from '../config/axiosConfig';
import { ApiResponse, Appointment, PaginatedResponse } from '../types';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  Firestore,
  limit as firestoreLimit,
  orderBy,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebaseClient';
import { hybridStorage } from '@/lib/utils/hybridStorage';

// Flag to control whether to use Firebase fallback
// Temporarily re-enabled to prevent network errors until backend is fully deployed
const USE_FIREBASE_FALLBACK = true;

// Cache TTL configuration
const CACHE_TTL = {
  SHORT: 60000,       // 1 minute
  MEDIUM: 300000,     // 5 minutes
  LONG: 3600000,      // 1 hour
  EXTENDED: 86400000  // 24 hours
};

/**
 * Service for appointment-related API endpoints with optimized performance
 */
export class AppointmentService extends BaseApiService<Appointment> {
  private apiClient: any;
  private hybridStorage: any;
  private db: Firestore;
  private lastDocumentSnapshot: Record<string, QueryDocumentSnapshot | null> = {};
  
  constructor() {
    super('appointments');
    this.apiClient = apiClient;
    this.hybridStorage = hybridStorage;
    this.db = db;
  }

  /**
   * Get all appointments for a doctor by ID with optimized performance
   */
  async getByDoctorId(
    doctorId: string, 
    status?: string, 
    page = 1, 
    limit = 10
  ): Promise<PaginatedResponse<Appointment>> {
    // Try to get from cache first to improve performance
    const cacheKey = `doctor_appointments_${doctorId}_${status || 'all'}_${page}_${limit}`;
    const cachedData = await this.hybridStorage.get(cacheKey) as PaginatedResponse<Appointment> | null;
    
    if (cachedData) {
      console.log('Using cached doctor appointments data');
      return cachedData;
    }
    
    // Set a timeout for the API request to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
    
    try {
      // Try API first with timeout
      const response = await this.apiCall<PaginatedResponse<Appointment>>(`/appointments/doctor/${doctorId}`, {
        params: { status, page, limit },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Cache successful response with a medium TTL
      await this.hybridStorage.set(cacheKey, response, 'MEDIUM');
      return response;
      
    } catch (error) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);
      
      if (this.shouldUseFirebaseFallback()) {
        // Fall back to Firebase if API fails
        console.log('Falling back to Firebase for doctor appointments');
        const result = await this.getAppointmentsByDoctorFromFirebase(doctorId, status, Number(limit), (page - 1) * Number(limit));
        
        const formattedResult: PaginatedResponse<Appointment> = {
          data: result.data,
          meta: {
            current_page: page,
            per_page: limit,
            total: result.total,
            last_page: Math.ceil(result.total / Number(limit))
          }
        };
        
        // Cache Firebase results with a short TTL
        await this.hybridStorage.set(cacheKey, formattedResult, 'SHORT');
        return formattedResult;
      }
      
      // If Firebase fallback is disabled, return empty result set
      return {
        data: [],
        meta: {
          current_page: page,
          per_page: limit,
          total: 0,
          last_page: 1
        }
      };
    }
  }

  /**
   * Get all appointments for a patient by ID with optimized performance
   */
  async getByPatientId(
    patientId: string, 
    status?: string, 
    page = 1, 
    limit = 10
  ): Promise<PaginatedResponse<Appointment>> {
    // Try to get from cache first to improve performance
    const cacheKey = `patient_appointments_${patientId}_${status || 'all'}_${page}_${limit}`;
    const cachedData = await this.hybridStorage.get(cacheKey) as PaginatedResponse<Appointment> | null;
    
    if (cachedData) {
      console.log('Using cached patient appointments data');
      return cachedData;
    }
    
    // Set a timeout for the API request to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout
    
    try {
      // Try API first with timeout
      const response = await this.apiCall<PaginatedResponse<Appointment>>(`/appointments/patient/${patientId}`, {
        params: { status, page, limit },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Cache successful response with a medium TTL
      await this.hybridStorage.set(cacheKey, response, 'MEDIUM');
      return response;
      
    } catch (error) {
      // Clear the timeout if it hasn't fired yet
      clearTimeout(timeoutId);
      
      if (this.shouldUseFirebaseFallback()) {
        // Fall back to Firebase if API fails
        console.log('Falling back to Firebase for patient appointments');
        const result = await this.getAppointmentsByPatientFromFirebase(patientId, status, Number(limit), (page - 1) * Number(limit));
        
        const formattedResult: PaginatedResponse<Appointment> = {
          data: result.data,
          meta: {
            current_page: page,
            per_page: limit,
            total: result.total,
            last_page: Math.ceil(result.total / Number(limit))
          }
        };
        
        // Cache Firebase results with a short TTL
        await this.hybridStorage.set(cacheKey, formattedResult, 'SHORT');
        return formattedResult;
      }
      
      // If Firebase fallback is disabled, return empty result set
      return {
        data: [],
        meta: {
          current_page: page,
          per_page: limit,
          total: 0,
          last_page: 1
        }
      };
    }
  }

  /**
   * Get a single appointment by ID with optimized caching
   */
  async getById(appointmentId: string, forceRefresh = false): Promise<Appointment | null> {
    const cacheKey = `appointment_${appointmentId}`;
    
    // Check hybrid cache first unless force refresh is requested
    if (!forceRefresh) {
      const cachedData = await this.hybridStorage.get(cacheKey) as Appointment | null;
      if (cachedData) {
        console.log('Using cached appointment data');
        return cachedData;
      }
    }
    
    try {
      const response = await super.getById(appointmentId);
      
      if (response) {
        // Cache successful response
        await this.hybridStorage.set(cacheKey, response, CACHE_TTL.MEDIUM);
      }
      
      return response;
    } catch (error) {
      // If API fails, try to get from Firebase
      if (USE_FIREBASE_FALLBACK) {
        try {
          const appointmentRef = doc(this.db, 'appointments', appointmentId);
          const docSnap = await getDoc(appointmentRef);
          
          if (docSnap.exists()) {
            const appointment = { 
              id: docSnap.id, 
              ...docSnap.data() 
            } as Appointment;
            
            // Cache Firebase result
            await this.hybridStorage.set(cacheKey, appointment, CACHE_TTL.MEDIUM);
            
            return appointment;
          }
        } catch (fbError) {
          console.error('Firebase error getting appointment:', fbError);
        }
      }
      
      return null;
    }
  }

  /**
   * Get appointments by doctor ID from Firebase with pagination and optimized queries
   */
  private async getAppointmentsByDoctorFromFirebase(
    doctorId: string, 
    status?: string, 
    pageSize = 10, 
    offset = 0
  ): Promise<{ data: Appointment[]; total: number }> {
    try {
      const appointmentsRef = collection(this.db, 'appointments');
      
      // Create base query with temporary removal of ordering to avoid index requirement
      let baseQuery = query(
        appointmentsRef, 
        where('doctorId', '==', doctorId)
      );
      
      // Add status filter if provided
      if (status) {
        baseQuery = query(baseQuery, where('status', '==', status));
      }
      
      // First, get total count
      const countSnapshot = await getDocs(baseQuery);
      const total = countSnapshot.size;
      
      // Then get paginated data
      let paginatedQuery;
      
      // Handle pagination in two ways:
      // 1. If offset-based (first page or jumping to a specific page)
      if (offset === 0 || !this.lastDocumentSnapshot[`doctor_${doctorId}_${status || 'all'}`]) {
        paginatedQuery = query(baseQuery, firestoreLimit(pageSize));
        const querySnapshot = await getDocs(paginatedQuery);
        
        // Store last document for potential next page
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (lastVisible) {
          this.lastDocumentSnapshot[`doctor_${doctorId}_${status || 'all'}`] = lastVisible;
        }
        
        return {
          data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)),
          total
        };
      } 
      // 2. If cursor-based (continuing from a previous page)
      else {
        const lastDoc = this.lastDocumentSnapshot[`doctor_${doctorId}_${status || 'all'}`];
        paginatedQuery = query(baseQuery, startAfter(lastDoc), firestoreLimit(pageSize));
        const querySnapshot = await getDocs(paginatedQuery);
        
        // Update last document for next page
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (lastVisible) {
          this.lastDocumentSnapshot[`doctor_${doctorId}_${status || 'all'}`] = lastVisible;
        }
        
        return {
          data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)),
          total
        };
      }
    } catch (error) {
      console.error('Error getting appointments from Firebase:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Get appointments by patient ID from Firebase with pagination and optimized queries
   */
  private async getAppointmentsByPatientFromFirebase(
    patientId: string, 
    status?: string, 
    pageSize = 10, 
    offset = 0
  ): Promise<{ data: Appointment[]; total: number }> {
    try {
      const appointmentsRef = collection(this.db, 'appointments');
      
      // Create base query with temporary removal of ordering to avoid index requirement
      let baseQuery = query(
        appointmentsRef, 
        where('patientId', '==', patientId)
      );
      
      // Add status filter if provided
      if (status) {
        baseQuery = query(baseQuery, where('status', '==', status));
      }
      
      // First, get total count
      const countSnapshot = await getDocs(baseQuery);
      const total = countSnapshot.size;
      
      // Then get paginated data
      let paginatedQuery;
      
      // Handle pagination in two ways:
      // 1. If offset-based (first page or jumping to a specific page)
      if (offset === 0 || !this.lastDocumentSnapshot[`patient_${patientId}_${status || 'all'}`]) {
        paginatedQuery = query(baseQuery, firestoreLimit(pageSize));
        const querySnapshot = await getDocs(paginatedQuery);
        
        // Store last document for potential next page
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (lastVisible) {
          this.lastDocumentSnapshot[`patient_${patientId}_${status || 'all'}`] = lastVisible;
        }
        
        return {
          data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)),
          total
        };
      } 
      // 2. If cursor-based (continuing from a previous page)
      else {
        const lastDoc = this.lastDocumentSnapshot[`patient_${patientId}_${status || 'all'}`];
        paginatedQuery = query(baseQuery, startAfter(lastDoc), firestoreLimit(pageSize));
        const querySnapshot = await getDocs(paginatedQuery);
        
        // Update last document for next page
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
        if (lastVisible) {
          this.lastDocumentSnapshot[`patient_${patientId}_${status || 'all'}`] = lastVisible;
        }
        
        return {
          data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)),
          total
        };
      }
    } catch (error) {
      console.error('Error getting appointments from Firebase:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Create a paginated response from an array of appointments
   */
  private createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit) || 1;
    
    return {
      data: data.slice(0, limit),
      meta: {
        total,
        per_page: limit,
        current_page: page,
        last_page: totalPages,
        first_page: 1,
        first_page_url: `/appointments?page=1&limit=${limit}`,
        last_page_url: `/appointments?page=${totalPages}&limit=${limit}`,
        next_page_url: page < totalPages ? `/appointments?page=${page + 1}&limit=${limit}` : null,
        prev_page_url: page > 1 ? `/appointments?page=${page - 1}&limit=${limit}` : null,
      }
    };
  }

  /**
   * Update appointment status with optimized caching
   */
  async updateStatus(appointmentId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'): Promise<Appointment | null> {
    try {
      const response: AxiosResponse<ApiResponse<Appointment>> = 
        await this.apiClient.patch(`/appointments/${appointmentId}/status`, { status });
      
      // Update cache with the new status
      const cacheKey = `appointment_${appointmentId}`;
      const cachedAppointment = await this.hybridStorage.get(cacheKey) as Appointment | null;
      
      if (cachedAppointment) {
        cachedAppointment.status = status;
        await this.hybridStorage.set(cacheKey, cachedAppointment, CACHE_TTL.MEDIUM);
      }
      
      return response.data.data;
    } catch (error) {
      // If API fails, try to update in Firebase
      if (USE_FIREBASE_FALLBACK) {
        try {
          const appointmentRef = doc(this.db, 'appointments', appointmentId);
          await updateDoc(appointmentRef, { status });
          
          // Get updated document
          const updatedDoc = await getDoc(appointmentRef);
          if (updatedDoc.exists()) {
            const updatedAppointment = { id: updatedDoc.id, ...updatedDoc.data() } as Appointment;
            
            // Update cache
            const cacheKey = `appointment_${appointmentId}`;
            await this.hybridStorage.set(cacheKey, updatedAppointment, CACHE_TTL.MEDIUM);
            
            return updatedAppointment;
          }
        } catch (fbError) {
          console.error('Firebase error updating appointment status:', fbError);
        }
      }
      
      this.handleError(error as AxiosError);
      return null;
    }
  }

  /**
   * Add medical notes to an appointment with optimized caching
   */
  async addMedicalNotes(appointmentId: string, notes: {
    symptoms?: string;
    diagnosis?: string;
    prescription?: string;
    followUpDate?: string;
  }): Promise<Appointment | null> {
    try {
      const response: AxiosResponse<ApiResponse<Appointment>> = 
        await this.apiClient.patch(`/appointments/${appointmentId}/medical-notes`, notes);
      
      // Update cache with the new notes
      const cacheKey = `appointment_${appointmentId}`;
      const cachedAppointment = await this.hybridStorage.get(cacheKey) as Appointment | null;
      
      if (cachedAppointment) {
        const updatedAppointment = {
          ...cachedAppointment,
          medicalNotes: {
            ...cachedAppointment.medicalNotes,
            ...notes
          }
        };
        await this.hybridStorage.set(cacheKey, updatedAppointment, CACHE_TTL.MEDIUM);
      }
      
      return response.data.data;
    } catch (error) {
      // If API fails, try to update in Firebase
      if (USE_FIREBASE_FALLBACK) {
        try {
          const appointmentRef = doc(this.db, 'appointments', appointmentId);
          
          // Get current document to update nested fields correctly
          const docSnap = await getDoc(appointmentRef);
          if (docSnap.exists()) {
            const currentData = docSnap.data();
            const currentNotes = currentData.medicalNotes || {};
            
            // Update with new notes
            await updateDoc(appointmentRef, { 
              medicalNotes: {
                ...currentNotes,
                ...notes
              }
            });
            
            // Get updated document
            const updatedDoc = await getDoc(appointmentRef);
            if (updatedDoc.exists()) {
              const updatedAppointment = { id: updatedDoc.id, ...updatedDoc.data() } as Appointment;
              
              // Update cache
              const cacheKey = `appointment_${appointmentId}`;
              await this.hybridStorage.set(cacheKey, updatedAppointment, CACHE_TTL.MEDIUM);
              
              return updatedAppointment;
            }
          }
        } catch (fbError) {
          console.error('Firebase error adding medical notes:', fbError);
        }
      }
      
      this.handleError(error as AxiosError);
      return null;
    }
  }

  // Helper method for API calls with better error handling
  private async apiCall<T>(endpoint: string, options?: any): Promise<T> {
    try {
      const response = await this.apiClient.get(endpoint, options);
      return response.data as T;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to determine if Firebase fallback should be used
  private shouldUseFirebaseFallback(): boolean {
    return USE_FIREBASE_FALLBACK;
  }
}
