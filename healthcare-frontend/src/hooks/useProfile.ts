import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { profileService, PatientProfile } from '@/lib/api/services/profileService';

/**
 * Hook for fetching patient profile with optimized caching
 */
export const usePatientProfile = (
  userId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) => {
  return useQuery({
    queryKey: ['patientProfile', userId] as QueryKey,
    queryFn: () => profileService.getPatientProfile(userId),
    enabled: !!userId && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 300000, // 5 minutes (MEDIUM cache)
    retry: 1,
    retryDelay: 1000,
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false
  });
};

/**
 * Hook for fetching doctor profile with optimized caching
 */
export const useDoctorProfile = (
  userId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) => {
  return useQuery({
    queryKey: ['doctorProfile', userId] as QueryKey,
    queryFn: () => profileService.getDoctorProfile(userId),
    enabled: !!userId && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 300000, // 5 minutes (MEDIUM cache)
    retry: 1,
    retryDelay: 1000,
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false
  });
};

/**
 * Hook for updating patient profile with optimistic updates
 */
export const useUpdatePatientProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      profile 
    }: { 
      userId: string; 
      profile: PatientProfile 
    }) => profileService.updatePatientProfile(userId, profile),
    
    // Use optimistic updates for instant UI feedback
    onMutate: async (variables) => {
      // Cancel any outgoing refetch requests
      await queryClient.cancelQueries({ 
        queryKey: ['patientProfile', variables.userId] as QueryKey
      });
      
      // Get snapshot of current profile data
      const previousProfile = queryClient.getQueryData<PatientProfile>(
        ['patientProfile', variables.userId]
      );
      
      // Optimistically update the profile
      queryClient.setQueryData(
        ['patientProfile', variables.userId], 
        variables.profile
      );
      
      // Return previous data for rollback
      return { previousProfile };
    },
    
    onSuccess: (data, variables) => {
      // Update cache with server data
      queryClient.setQueryData(
        ['patientProfile', variables.userId],
        data
      );
    },
    
    onError: (error, variables, context) => {
      // On error, rollback to the previous value
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ['patientProfile', variables.userId],
          context.previousProfile
        );
      }
      console.error('Error updating patient profile:', error);
    }
  });
};

/**
 * Hook for updating doctor profile with optimistic updates
 */
export const useUpdateDoctorProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      userId, 
      profile 
    }: { 
      userId: string; 
      profile: any 
    }) => profileService.updateDoctorProfile(userId, profile),
    
    // Use optimistic updates for instant UI feedback
    onMutate: async (variables) => {
      // Cancel any outgoing refetch requests
      await queryClient.cancelQueries({ 
        queryKey: ['doctorProfile', variables.userId] as QueryKey
      });
      
      // Get snapshot of current profile data
      const previousProfile = queryClient.getQueryData(
        ['doctorProfile', variables.userId]
      );
      
      // Optimistically update the profile
      queryClient.setQueryData(
        ['doctorProfile', variables.userId], 
        variables.profile
      );
      
      // Return previous data for rollback
      return { previousProfile };
    },
    
    onSuccess: (data, variables) => {
      // Update cache with server data
      queryClient.setQueryData(
        ['doctorProfile', variables.userId],
        data
      );
    },
    
    onError: (error, variables, context) => {
      // On error, rollback to the previous value
      if (context?.previousProfile) {
        queryClient.setQueryData(
          ['doctorProfile', variables.userId],
          context.previousProfile
        );
      }
      console.error('Error updating doctor profile:', error);
    }
  });
};

/**
 * Hook to prefetch profile data when navigating 
 */
export const usePrefetchProfile = () => {
  const queryClient = useQueryClient();
  
  const prefetchPatientProfile = async (userId: string) => {
    if (!userId) return;
    
    // Only prefetch if not in cache already
    const existing = queryClient.getQueryData(['patientProfile', userId]);
    if (!existing) {
      await queryClient.prefetchQuery({
        queryKey: ['patientProfile', userId] as QueryKey,
        queryFn: () => profileService.getPatientProfile(userId),
        staleTime: 300000 // 5 minutes
      });
    }
  };
  
  const prefetchDoctorProfile = async (userId: string) => {
    if (!userId) return;
    
    // Only prefetch if not in cache already
    const existing = queryClient.getQueryData(['doctorProfile', userId]);
    if (!existing) {
      await queryClient.prefetchQuery({
        queryKey: ['doctorProfile', userId] as QueryKey,
        queryFn: () => profileService.getDoctorProfile(userId),
        staleTime: 300000 // 5 minutes
      });
    }
  };
  
  return { prefetchPatientProfile, prefetchDoctorProfile };
};
