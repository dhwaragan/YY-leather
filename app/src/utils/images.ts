/**
 * Image optimization utilities.
 * - Enhances Unsplash/Cloudinary/Supabase URLs to request compressed sizes
 * - Generates srcset for responsive loading
 * - Adds lazy loading attributes
 */

// Unsplash CDN optimization: request WebP format and appropriate size
export function optimizeImage(url: string | undefined, width: number = 600): string {
  if (!url) return '';
  
  // Unsplash images - add auto=format (WebP) and width params
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?q=60&w=${width}&auto=format&fit=crop`;
  }
  
  // Cloudinary images - add format conversion
  if (url.includes('cloudinary.com')) {
    // If already contains optimization parameters, don't stack duplicates
    if (url.includes('/upload/f_auto')) return url;
    // Insert f_auto,q_60,w_{width} params into Cloudinary URL
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_60,w_${width}/${parts[1]}`;
    }
  }
  
  // Supabase Storage URLs - Free plans do not support image transformation,
  // so return the direct public URL to prevent broken images.
  if (url.includes('.supabase.co')) {
    return url;
  }
  
  return url;
}

// Generate srcset for responsive images (STEP 4)
// Creates multiple width versions for Unsplash, Cloudinary, and Supabase
export function generateSrcSet(url: string | undefined, maxWidth: number = 800): string {
  if (!url) return '';
  
  // Unsplash srcset - multiple widths
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    const widths = [320, 480, 640, 800, 1200].filter(w => w <= Math.max(maxWidth, 800));
    return widths.map(w => `${baseUrl}?q=60&w=${w}&auto=format&fit=crop ${w}w`).join(', ');
  }
  
  // Cloudinary srcset - multiple widths
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const widths = [320, 480, 640, 800, 1200].filter(w => w <= Math.max(maxWidth, 800));
      return widths.map(w => `${parts[0]}/upload/f_auto,q_60,w_${w}/${parts[1]} ${w}w`).join(', ');
    }
  }
  
  // Supabase Storage URLs - Free plans do not support image transformation
  if (url.includes('.supabase.co')) {
    return '';
  }
  
  return '';
}

// Lazy loading props for images
export function lazyImgProps(src: string, width: number = 600) {
  return {
    src: optimizeImage(src, width),
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

// Responsive image props with srcset (STEP 4 + STEP 5)
export function responsiveImgProps(src: string | undefined, displayWidth: number = 400, sizes?: string) {
  if (!src) return { src: '', loading: 'lazy' as const, decoding: 'async' as const };
  return {
    src: optimizeImage(src, displayWidth),
    srcSet: generateSrcSet(src, displayWidth),
    sizes: sizes || `${displayWidth}px`,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

// Eager loading props for above-the-fold images (STEP 6)
export function eagerImgProps(src: string | undefined, displayWidth: number = 800, sizes?: string) {
  if (!src) return { src: '', loading: 'eager' as const, decoding: 'async' as const, fetchPriority: 'high' as const };
  return {
    src: optimizeImage(src, displayWidth),
    srcSet: generateSrcSet(src, displayWidth),
    sizes: sizes || `${displayWidth}px`,
    loading: 'eager' as const,
    decoding: 'async' as const,
    fetchPriority: 'high' as const,
  };
}