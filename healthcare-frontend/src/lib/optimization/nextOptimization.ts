/**
 * Next.js specific optimization utilities
 * Implements optimizations specific to the Next.js framework
 */
import { cache } from 'react';
import type { ComponentType } from 'react';
import { memoDeep } from './memoization';

/**
 * Create a stable data fetcher with built-in caching for server components
 * @param fetchFn The data fetching function to memoize
 */
export function createStableServerFetcher<Args extends any[], Result>(
  fetchFn: (...args: Args) => Promise<Result>
) {
  return cache(fetchFn);
}

/**
 * Optimize component rendering with Next.js best practices
 * - Deeply memoizes the component to prevent unnecessary re-renders
 * - Adds displayName for better debugging
 * - Works with both client and server components
 * 
 * @param Component The component to optimize
 * @param displayName Optional custom display name
 */
export function optimizeComponent<T extends ComponentType<any>>(
  Component: T,
  displayName?: string
): ComponentType<React.ComponentProps<T>> {
  const OptimizedComponent = memoDeep(Component, {
    displayName: displayName || `Optimized(${Component.displayName || Component.name})`
  });
  
  return OptimizedComponent;
}

/**
 * Router events for page navigation performance tracking
 * To be used with Next.js App Router
 */
export function setupRouterPerformanceTracking() {
  if (typeof window === 'undefined') return;
  
  const { usePathname, useSearchParams } = require('next/navigation');
  
  return function RouterPerformanceTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Track route changes
    if (pathname && (window as any).perf) {
      (window as any).perf.start(`Route Navigation: ${pathname}`);
      
      // End timing after the route has fully rendered
      setTimeout(() => {
        (window as any).perf.end(`Route Navigation: ${pathname}`);
      }, 0);
    }
    
    return null;
  };
}

/**
 * Optimized image loading patterns for Next.js Image component
 */
export const imageLoading = {
  // For images above the fold that should load with high priority
  priority: {
    priority: true,
    loading: 'eager',
  },
  
  // For images that can be lazy-loaded
  lazy: {
    priority: false,
    loading: 'lazy',
  },
  
  // For important images that should be preloaded but not blocking
  preload: {
    priority: false,
    loading: 'eager',
  }
};

/**
 * Constants for common cache control headers
 */
export const CACHE_HEADERS = {
  // Assets that rarely change (images, fonts, etc.)
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  
  // Data that may change but can be stale for a while
  data: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
  
  // Pages that should revalidate frequently
  page: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  },
  
  // For user-specific content that shouldn't be cached
  private: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  }
};
