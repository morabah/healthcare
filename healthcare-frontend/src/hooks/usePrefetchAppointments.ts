import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { appointmentService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to prefetch appointments data when user navigates to dashboard
 * This optimizes loading time when user later clicks on appointments page
 */
export const usePrefetchAppointments = () => {
  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  
  // Prefetch doctor appointments
  const prefetchDoctorAppointments = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const queryKey = ['appointments', 'doctor', user.uid, undefined, 1, 50];
      
      // Only prefetch if data isn't already in cache
      if (!queryClient.getQueryData(queryKey)) {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: () => appointmentService.getByDoctorId(user.uid || '', undefined, 1, 50),
          staleTime: 300000 // 5 minutes
        });
        console.log('Doctor appointments prefetched');
      }
    } catch (error) {
      // Silently fail - prefetching is optional optimization
      console.log('Prefetch failed (non-critical):', error);
    }
  }, [user?.uid, queryClient]);
  
  // Prefetch patient appointments
  const prefetchPatientAppointments = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const queryKey = ['appointments', 'patient', user.uid, undefined, 1, 50];
      
      // Only prefetch if data isn't already in cache
      if (!queryClient.getQueryData(queryKey)) {
        await queryClient.prefetchQuery({
          queryKey,
          queryFn: () => appointmentService.getByPatientId(user.uid || '', undefined, 1, 50),
          staleTime: 300000 // 5 minutes
        });
        console.log('Patient appointments prefetched');
      }
    } catch (error) {
      // Silently fail - prefetching is optional optimization
      console.log('Prefetch failed (non-critical):', error);
    }
  }, [user?.uid, queryClient]);
  
  // Prefetch based on user role
  useEffect(() => {
    if (!user || !userData?.role) return;
    
    // Small delay to avoid contention with initial page load
    const timerId = setTimeout(() => {
      if (userData.role === 'doctor') {
        prefetchDoctorAppointments();
      } else if (userData.role === 'patient') {
        prefetchPatientAppointments();
      }
    }, 2000);
    
    return () => clearTimeout(timerId);
  }, [user, userData?.role, prefetchDoctorAppointments, prefetchPatientAppointments]);
  
  return {
    prefetchDoctorAppointments,
    prefetchPatientAppointments
  };
};
