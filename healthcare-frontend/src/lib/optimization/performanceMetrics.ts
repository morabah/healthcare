/**
 * Performance Metrics Tracking
 * Monitors key performance metrics throughout the application
 */

// Constants for performance thresholds
const THRESHOLDS = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift (score)
  TTI: 3800, // Time to Interactive (ms)
  TBT: 200,  // Total Blocking Time (ms)
} as const;

/**
 * Initialize performance monitoring
 * Sets up Web Vitals reporting for key metrics
 */
export function initPerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    import('web-vitals').then(({ onCLS, onFID, onLCP, onTTFB, onFCP }) => {
      // Core Web Vitals
      onCLS(metric => logMetric('CLS', metric.value));
      onFID(metric => logMetric('FID', metric.value));
      onLCP(metric => logMetric('LCP', metric.value));
      
      // Additional metrics
      onTTFB(metric => logMetric('TTFB', metric.value));
      onFCP(metric => logMetric('FCP', metric.value));
      
      // Custom performance marks
      trackNavigationTiming();
      trackResourceTiming();
      trackJSExecution();
    });
  }
}

/**
 * Track resource loading times (scripts, styles, images)
 */
function trackResourceTiming(): void {
  if (!(window.performance && window.performance.getEntriesByType)) return;
  
  // Monitor resource loading
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming;
        
        // Only log slow resources (>500ms)
        if (resource.duration > 500) {
          console.debug(`Slow resource: ${resource.name} - ${Math.round(resource.duration)}ms`);
        }
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
}

/**
 * Track navigation timing metrics 
 */
function trackNavigationTiming(): void {
  if (!(window.performance && window.performance.timing)) return;
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      const timing = performance.timing;
      
      // Calculate key timing metrics
      const dns = timing.domainLookupEnd - timing.domainLookupStart;
      const tcp = timing.connectEnd - timing.connectStart;
      const ttfb = timing.responseStart - timing.requestStart;
      const contentLoad = timing.domContentLoadedEventEnd - timing.navigationStart;
      const pageLoad = timing.loadEventEnd - timing.navigationStart;
      
      // Log navigation timing
      console.debug('Navigation Timing:', {
        'DNS Lookup': `${dns}ms`,
        'TCP Connection': `${tcp}ms`,
        'TTFB': `${ttfb}ms`,
        'DOM Content Loaded': `${contentLoad}ms`,
        'Page Load': `${pageLoad}ms`,
      });
    }, 0);
  });
}

/**
 * Track JavaScript execution times for key operations
 */
function trackJSExecution(): void {
  if (typeof window === 'undefined') return;
  
  // Create a map to store JS execution timings
  const timings: Record<string, number> = {};
  
  // Add perf measurement methods to window for global access
  (window as any).perf = {
    start: (label: string) => {
      timings[label] = performance.now();
    },
    end: (label: string) => {
      if (timings[label]) {
        const duration = performance.now() - timings[label];
        console.debug(`🔍 JS Execution - ${label}: ${duration.toFixed(2)}ms`);
        delete timings[label];
        return duration;
      }
    }
  };
}

/**
 * Log performance metrics with threshold indicators
 */
function logMetric(name: string, value: number): void {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  
  // Format the value based on metric type
  const formattedValue = name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`;
  
  // Determine if metric exceeds threshold
  let status = '✅';
  if (threshold !== undefined && value > threshold) {
    status = '⚠️';
  }
  
  console.debug(`${status} ${name}: ${formattedValue}`);
}

/**
 * Track React component render times
 * @param componentName Name of the component to track
 * @param callback Function to time
 */
export function trackRender<T>(componentName: string, callback: () => T): T {
  if (typeof window === 'undefined' || !componentName) {
    return callback();
  }
  
  const startTime = performance.now();
  const result = callback();
  const duration = performance.now() - startTime;
  
  // Log slow renders (>16ms is slower than 60fps)
  if (duration > 16) {
    console.debug(`🐢 Slow render: ${componentName} - ${duration.toFixed(2)}ms`);
  }
  
  return result;
}
