import React, { useState, useRef, useEffect, memo } from 'react';
import { useIntersectionObserver, useNetworkStatus } from '../hooks/usePerformance';

/**
 * OptimizedImage - Performance-optimized image component
 * - Lazy loads when in viewport
 * - Blur-up placeholder effect
 * - Responsive srcset support
 * - Network-aware quality
 * - Native aspect ratio support
 */
const OptimizedImage = memo(({
  src,
  alt = '',
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  placeholder = 'blur', // 'blur' | 'empty' | 'skeleton'
  blurDataUrl,
  onLoad,
  onError,
  aspectRatio,
  objectFit = 'cover',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [ref, isVisible] = useIntersectionObserver({ rootMargin: '200px' });
  const networkStatus = useNetworkStatus();
  const imgRef = useRef(null);

  // Should load: priority OR (visible AND online)
  const shouldLoad = priority || (isVisible && networkStatus.online);

  // Generate blur placeholder if not provided
  const placeholderStyle = placeholder === 'blur' ? {
    filter: isLoaded ? 'none' : 'blur(20px)',
    transform: isLoaded ? 'scale(1)' : 'scale(1.1)',
    transition: 'filter 0.3s ease-out, transform 0.3s ease-out',
  } : {};

  // Calculate aspect ratio padding
  const paddingBottom = aspectRatio 
    ? `${(1 / aspectRatio) * 100}%`
    : height && width 
      ? `${(height / width) * 100}%`
      : undefined;

  // Handle image load
  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  // Handle image error
  const handleError = (e) => {
    setHasError(true);
    onError?.(e);
  };

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      return () => document.head.removeChild(link);
    }
  }, [priority, src]);

  if (hasError) {
    return (
      <div 
        className={`bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ paddingBottom, position: paddingBottom ? 'relative' : undefined }}
      >
        <div className="text-gray-400 text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{ 
        paddingBottom,
        position: paddingBottom ? 'relative' : undefined,
        backgroundColor: placeholder === 'skeleton' ? '#e5e7eb' : undefined,
      }}
    >
      {placeholder === 'skeleton' && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
      
      {shouldLoad && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          className={paddingBottom ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}
          style={{ 
            objectFit,
            ...placeholderStyle,
          }}
          {...props}
        />
      )}
      
      {/* Blur placeholder */}
      {placeholder === 'blur' && blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit, filter: 'blur(20px)', transform: 'scale(1.1)' }}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Avatar - Optimized avatar image with fallback
 */
export const Avatar = memo(({ 
  src, 
  name = '', 
  size = 'md',
  className = '',
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bgColors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  
  // Deterministic color based on name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = bgColors[colorIndex % bgColors.length];

  if (!src || hasError) {
    return (
      <div 
        className={`${sizes[size]} ${bgColor} rounded-full flex items-center justify-center text-white font-medium ${className}`}
        {...props}
      >
        {initials || '?'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setHasError(true)}
      className={`${sizes[size]} rounded-full object-cover ${className}`}
      loading="lazy"
      {...props}
    />
  );
});

Avatar.displayName = 'Avatar';

/**
 * BackgroundImage - Optimized background image container
 */
export const BackgroundImage = memo(({ 
  src, 
  children, 
  className = '',
  overlay = false,
  overlayOpacity = 0.5,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, isVisible] = useIntersectionObserver({ rootMargin: '100px' });

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [isVisible, src]);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{
        backgroundImage: isLoaded ? `url(${src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      {...props}
    >
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

BackgroundImage.displayName = 'BackgroundImage';

// Add shimmer keyframes to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  if (!document.querySelector('[data-optimized-image-styles]')) {
    style.setAttribute('data-optimized-image-styles', '');
    document.head.appendChild(style);
  }
}

export default OptimizedImage;
