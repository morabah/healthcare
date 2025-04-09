import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { AppointmentService } from '@/lib/api/services/appointmentService';
import { Appointment, PaginatedResponse } from '@/lib/api/types';
import { appointmentService } from '@/lib/api';

/**
 * Hook for fetching doctor appointments with optimized caching and performance
 */
export const useDoctorAppointments = (
  doctorId: string, 
  status?: string, 
  page = 1, 
  limit = 10,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  }
) => {
  return useQuery({
    queryKey: ['appointments', 'doctor', doctorId, status, page, limit] as QueryKey,
    queryFn: () => appointmentService.getByDoctorId(
      doctorId || '', 
      status, 
      page, 
      limit
    ),
    // Only fetch if we have a doctorId and the query is enabled
    enabled: !!doctorId && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 300000, // 5 minutes (MEDIUM cache)
    retry: 2, // Increase retry count for flaky connections
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 30000), // Exponential backoff
    gcTime: 600000, // 10 minutes
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: false // Don't refetch on window focus for a better UX
  });
};

/**
 * Hook for fetching patient appointments with optimized caching and performance
 */
export const usePatientAppointments = (
  patientId: string, 
  status?: string, 
  page = 1, 
  limit = 10,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
  }
) => {
  return useQuery({
    queryKey: ['appointments', 'patient', patientId, status, page, limit] as QueryKey,
    queryFn: () => appointmentService.getByPatientId(
      patientId || '', 
      status, 
      page, 
      limit
    ),
    // Only fetch if we have a patientId and the query is enabled
    enabled: !!patientId && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 300000, // 5 minutes (MEDIUM cache)
    retry: 2, // Increase retry count for flaky connections
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 30000), // Exponential backoff
    gcTime: 600000, // 10 minutes
    refetchInterval: options?.refetchInterval ?? false,
    refetchOnWindowFocus: false // Don't refetch on window focus for a better UX
  });
};

/**
 * Hook for fetching a single appointment by ID with optimized caching
 */
export const useAppointment = (
  appointmentId: string, 
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['appointment', appointmentId] as QueryKey,
    queryFn: () => appointmentService.getById(appointmentId || ''),
    enabled: !!appointmentId && (options?.enabled !== false),
    // Don't refetch on window focus for a better UX
    refetchOnWindowFocus: false
  });
};

/**
 * Hook for updating appointment status with optimistic updates
 */
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      appointmentId, 
      status 
    }: { 
      appointmentId: string; 
      status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' 
    }) => appointmentService.updateStatus(appointmentId, status),
    
    // Use optimistic updates for instant UI feedback
    onMutate: async (variables) => {
      // Cancel any outgoing refetch requests to avoid overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['appointment', variables.appointmentId] as QueryKey
      });
      
      // Get snapshot of current appointment data
      const previousAppointment = queryClient.getQueryData<Appointment>(
        ['appointment', variables.appointmentId]
      );
      
      // Optimistically update the appointment status
      if (previousAppointment) {
        queryClient.setQueryData(
          ['appointment', variables.appointmentId], 
          {
            ...previousAppointment,
            status: variables.status
          }
        );
      }
      
      // Also update the appointment in the list views
      const updateListData = (key: QueryKey, data: PaginatedResponse<Appointment> | undefined) => {
        if (!data) return undefined;
        
        return {
          ...data,
          data: data.data.map(appointment => 
            appointment.id === variables.appointmentId 
              ? { ...appointment, status: variables.status } 
              : appointment
          )
        };
      };
      
      // Update doctor appointments lists
      queryClient.setQueriesData(
        { queryKey: ['appointments', 'doctor'] }, 
        (data: any) => updateListData(['appointments', 'doctor'] as QueryKey, data)
      );
      
      // Update patient appointments lists
      queryClient.setQueriesData(
        { queryKey: ['appointments', 'patient'] }, 
        (data: any) => updateListData(['appointments', 'patient'] as QueryKey, data)
      );
      
      // Return previous data for rollback
      return { previousAppointment };
    },
    
    onSuccess: (data, variables) => {
      // Invalidate the specific appointment to sync with server
      queryClient.invalidateQueries({ 
        queryKey: ['appointment', variables.appointmentId] as QueryKey
      });
      
      // Invalidate appointment lists that might contain this appointment
      queryClient.invalidateQueries({ 
        queryKey: ['appointments'] as QueryKey,
        exact: false
      });
    },
    
    onError: (error, variables, context) => {
      // On error, rollback to the previous value
      if (context?.previousAppointment) {
        queryClient.setQueryData(
          ['appointment', variables.appointmentId],
          context.previousAppointment
        );
      }
      console.error('Error updating appointment status:', error);
    }
  });
};

/**
 * Hook for adding medical notes to an appointment with optimistic updates
 */
export const useAddMedicalNotes = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      appointmentId, 
      notes 
    }: { 
      appointmentId: string; 
      notes: Record<string, string> 
    }) => appointmentService.addMedicalNotes(appointmentId, notes),
    
    // Use optimistic updates for instant UI feedback
    onMutate: async (variables) => {
      // Cancel any outgoing refetch requests to avoid overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['appointment', variables.appointmentId] as QueryKey
      });
      
      // Get snapshot of current appointment data
      const previousAppointment = queryClient.getQueryData<Appointment>(
        ['appointment', variables.appointmentId]
      );
      
      // Optimistically update the appointment notes
      if (previousAppointment) {
        queryClient.setQueryData(
          ['appointment', variables.appointmentId], 
          {
            ...previousAppointment,
            medicalNotes: {
              ...(previousAppointment.medicalNotes || {}),
              ...variables.notes
            }
          }
        );
      }
      
      // Return previous data for rollback
      return { previousAppointment };
    },
    
    onSuccess: (data, variables) => {
      // Invalidate the specific appointment
      queryClient.invalidateQueries({ 
        queryKey: ['appointment', variables.appointmentId] as QueryKey 
      });
    },
    
    onError: (error, variables, context) => {
      // On error, rollback to the previous value
      if (context?.previousAppointment) {
        queryClient.setQueryData(
          ['appointment', variables.appointmentId],
          context.previousAppointment
        );
      }
      console.error('Error adding medical notes:', error);
    }
  });
};
