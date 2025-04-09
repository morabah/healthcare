/**
 * Common types for API services
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    first_page: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
  };
}

export interface DoctorProfile {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  location: string;
  languages: string;
  yearsOfExperience: string;
  education: string;
  professionalBio: string;
  consultationFee: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientProfile {
  id?: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  contactNumber?: string;
  address?: string;
  medicalHistory?: string[];
  allergies?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id?: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
  medicalNotes?: {
    symptoms?: string;
    diagnosis?: string;
    prescription?: string;
    followUpDate?: string;
    [key: string]: any;
  };
  patientName?: string;
  doctorName?: string;
}

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'patient' | 'doctor';
  photoURL?: string | null;
  createdAt?: string;
  lastLogin?: string;
}
