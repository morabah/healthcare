// Export all API services and types
import apiClient from './config/axiosConfig';
import { BaseApiService } from './services/baseService';
import { DoctorService } from './services/doctorService';
import { PatientService } from './services/patientService';
import { AppointmentService } from './services/appointmentService';
import * as ApiTypes from './types';

// Create instances of services
const doctorService = new DoctorService();
const patientService = new PatientService();
const appointmentService = new AppointmentService();

// Export everything
export {
  apiClient,
  BaseApiService,
  doctorService,
  patientService,
  appointmentService,
  ApiTypes
};
