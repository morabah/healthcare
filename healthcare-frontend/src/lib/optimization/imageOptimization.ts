/**
 * Image optimization utilities for the healthcare application
 * This module provides image optimization, lazy loading, and caching strategies
 */

/**
 * Generate optimized image URL parameters for Cloud Storage/Firebase
 * @param url Original image URL
 * @param width Desired width
 * @param quality Image quality (1-100)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(url: string, width: number = 500, quality: number = 80): string {
  if (!url) return '';
  
  // If it's a Firebase Storage URL, add image optimization parameters
  if (url.includes('firebasestorage.googleapis.com')) {
    // Firebase Storage image URL optimization
    // Using the image transcoding parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}&height=0`;
  }
  
  // If it's a Google Cloud Storage URL
  if (url.includes('storage.googleapis.com')) {
    // Google Cloud Storage image URL optimization
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}`;
  }
  
  // For external images, just return the original URL
  return url;
}

/**
 * Image dimensions presets for different components
 */
export const ImageSizes = {
  avatar: {
    small: 40,
    medium: 64,
    large: 128
  },
  thumbnail: {
    small: 80,
    medium: 150,
    large: 300
  },
  hero: {
    small: 640,
    medium: 960,
    large: 1280
  }
};

/**
 * Calculate the srcSet attribute for responsive images
 * @param baseUrl Base image URL
 * @param widths Array of widths for the srcSet
 * @param quality Image quality
 * @returns Complete srcSet string
 */
export function getSrcSet(baseUrl: string, widths: number[] = [320, 640, 960, 1280], quality: number = 80): string {
  if (!baseUrl) return '';
  
  return widths
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(baseUrl, width, quality);
      return `${optimizedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate blur placeholder data URL for images
 * This creates a tiny base64 placeholder that can be used while the image loads
 * Note: Only works on the server side or during build time
 */
export function generateBlurPlaceholder(color: string = '#f0f4f8'): string {
  // Fallback SVG-based placeholder
  const svg = `
    <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${color}" />
    </svg>
  `;
  
  // Convert to base64
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Image loading priorities for different types of images
 */
export const ImagePriority = {
  // Critical images that should be preloaded
  critical: 'high',
  // Images that are visible above the fold but not critical
  high: 'high',
  // Images below the fold that can be lazy-loaded
  low: 'low'
} as const;
