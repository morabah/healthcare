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
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
