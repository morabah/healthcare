import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentService } from '@/lib/api/services/appointmentService';
import { Appointment, PaginatedResponse } from '@/lib/api/types';

const appointmentService = new AppointmentService();

/**
 * Hook for fetching doctor appointments with optimized caching and performance
 */
export const useDoctorAppointments = (
  doctorId?: string, 
  status?: string, 
  page = 1, 
  limit = 10,
  options?: { 
    enabled?: boolean, 
    staleTime?: number,
    forceRefresh?: boolean
  }
) => {
  return useQuery({
    queryKey: ['appointments', 'doctor', doctorId, status, page, limit],
    queryFn: () => appointmentService.getByDoctorId(
      doctorId || '', 
      status, 
      page, 
      limit,
      options?.forceRefresh
    ),
    // Only fetch if we have a doctorId and the query is enabled
    enabled: !!doctorId && (options?.enabled !== false),
    staleTime: options?.staleTime,
    // Don't refetch on window focus for a better UX
    refetchOnWindowFocus: false
  });
};

/**
 * Hook for fetching patient appointments with optimized caching and performance
 */
export const usePatientAppointments = (
  patientId?: string, 
  status?: string, 
  page = 1, 
  limit = 10,
  options?: { 
    enabled?: boolean, 
    staleTime?: number,
    forceRefresh?: boolean
  }
) => {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId, status, page, limit],
    queryFn: () => appointmentService.getByPatientId(
      patientId || '', 
      status, 
      page, 
      limit,
      options?.forceRefresh
    ),
    // Only fetch if we have a patientId and the query is enabled
    enabled: !!patientId && (options?.enabled !== false),
    staleTime: options?.staleTime,
    // Don't refetch on window focus for a better UX
    refetchOnWindowFocus: false
  });
};

/**
 * Hook for fetching a single appointment by ID with optimized caching
 */
export const useAppointment = (
  appointmentId?: string,
  options?: { 
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentService.getById(appointmentId || ''),
    enabled: !!appointmentId && (options?.enabled !== false),
    // Don't refetch on window focus for a better UX
    refetchOnWindowFocus: false
  });
};

/**
 * Hook for updating an appointment status with optimistic updates
 */
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { 
      appointmentId: string; 
      status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' 
    }) => {
      return appointmentService.updateStatus(params.appointmentId, params.status);
    },
    // When the mutation is successful, invalidate any queries that include this appointment
    onSuccess: (data, variables) => {
      // Invalidate the specific appointment
      queryClient.invalidateQueries({ 
        queryKey: ['appointment', variables.appointmentId]
      });
      
      // Invalidate appointment lists that might contain this appointment
      queryClient.invalidateQueries({
        queryKey: ['appointments'],
        exact: false
      });
    }
  });
};

/**
 * Hook for adding medical notes to an appointment
 */
export const useAddMedicalNotes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { 
      appointmentId: string; 
      notes: {
        symptoms?: string;
        diagnosis?: string;
        prescription?: string;
        followUpDate?: string;
      }
    }) => {
      return appointmentService.addMedicalNotes(params.appointmentId, params.notes);
    },
    // When the mutation is successful, invalidate any queries that include this appointment
    onSuccess: (data, variables) => {
      // Invalidate the specific appointment
      queryClient.invalidateQueries({ 
        queryKey: ['appointment', variables.appointmentId] 
      });
    }
  });
};
