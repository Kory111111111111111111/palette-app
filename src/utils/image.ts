export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ImageProcessingOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxWidth: 4096,
  maxHeight: 4096,
  quality: 0.8
};

export function validateImage(file: File, options: ImageProcessingOptions = {}): ImageValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check file size
  if (file.size > opts.maxSizeBytes) {
    return {
      isValid: false,
      error: `File size must be under ${Math.round(opts.maxSizeBytes / (1024 * 1024))}MB`
    };
  }

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Only ${opts.allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} images are supported`
    };
  }

  return { isValid: true };
}

export function processImage(file: File, options: ImageProcessingOptions = {}): Promise<string> {
  console.log('🖼️ [Image Utils] Processing image:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  return new Promise((resolve, reject) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    console.log('🖼️ [Image Utils] Processing options:', opts);
    
    // Validate first
    const validation = validateImage(file, opts);
    console.log('🖼️ [Image Utils] Validation result:', validation);
    
    if (!validation.isValid) {
      console.error('🖼️ [Image Utils] Validation failed:', validation.error);
      reject(new Error(validation.error));
      return;
    }

    console.log('🖼️ [Image Utils] Starting FileReader...');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      console.log('🖼️ [Image Utils] FileReader completed successfully');
      const result = e.target?.result as string;
      console.log('🖼️ [Image Utils] Result length:', result?.length);
      resolve(result);
    };
    
    reader.onerror = (error) => {
      console.error('🖼️ [Image Utils] FileReader error:', error);
      reject(new Error('Failed to read image file'));
    };
    
    console.log('🖼️ [Image Utils] Reading file as data URL...');
    reader.readAsDataURL(file);
  });
}

export function compressImage(
  dataUrl: string, 
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  console.log('🗜️ [Image Utils] Starting image compression...');
  console.log('🗜️ [Image Utils] Input data URL length:', dataUrl.length);
  
  return new Promise((resolve, reject) => {
    const opts = {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 0.8,
      ...options
    };
    console.log('🗜️ [Image Utils] Compression options:', opts);

    const img = new Image();
    img.onload = () => {
      console.log('🗜️ [Image Utils] Image loaded for compression:', {
        originalWidth: img.width,
        originalHeight: img.height
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('🗜️ [Image Utils] Failed to create canvas context');
        reject(new Error('Failed to create canvas context'));
        return;
      }

      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width *= ratio;
        height *= ratio;
        console.log('🗜️ [Image Utils] Resizing image:', { width, height, ratio });
      } else {
        console.log('🗜️ [Image Utils] Image size within limits, no resizing needed');
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      console.log('🗜️ [Image Utils] Drawing image to canvas...');
      ctx.drawImage(img, 0, 0, width, height);
      
      console.log('🗜️ [Image Utils] Converting to compressed data URL...');
      const compressedDataUrl = canvas.toDataURL('image/jpeg', opts.quality);
      console.log('🗜️ [Image Utils] Compression completed, output length:', compressedDataUrl.length);
      
      resolve(compressedDataUrl);
    };

    img.onerror = (error) => {
      console.error('🗜️ [Image Utils] Failed to load image for compression:', error);
      reject(new Error('Failed to load image for compression'));
    };

    console.log('🗜️ [Image Utils] Setting image source...');
    img.src = dataUrl;
  });
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}
