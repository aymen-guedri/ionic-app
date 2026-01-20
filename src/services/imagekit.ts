import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface ImageKitConfig {
  publicKey: string;
  urlEndpoint: string;
  authenticationEndpoint: string;
}

export interface UploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
}

export class ImageKitService {
  private static config: ImageKitConfig = {
    publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
    urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
    authenticationEndpoint: import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT || 'http://localhost:3001/auth'
  };

  // Take photo using device camera
  static async takePhoto(): Promise<string> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 300,
        height: 300
      });

      return image.dataUrl!;
    } catch (error) {
      console.error('Error taking photo:', error);
      throw new Error('Failed to take photo');
    }
  }

  // Select photo from gallery
  static async selectFromGallery(): Promise<string> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        width: 300,
        height: 300
      });

      return image.dataUrl!;
    } catch (error) {
      console.error('Error selecting photo:', error);
      throw new Error('Failed to select photo');
    }
  }

  // Upload image to ImageKit
  static async uploadImage(
    dataUrl: string, 
    fileName: string, 
    folder: string = 'smart-parking'
  ): Promise<UploadResponse> {
    try {
      const authResponse = await fetch(this.config.authenticationEndpoint);
      const authData = await authResponse.json();

      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('publicKey', this.config.publicKey);
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire);
      formData.append('token', authData.token);
      formData.append('folder', folder);
      formData.append('useUniqueFileName', 'true');

      const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const result = await uploadResponse.json();
      return {
        fileId: result.fileId,
        name: result.name,
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        height: result.height,
        width: result.width,
        size: result.size
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  // Generate optimized image URL
  static getOptimizedUrl(
    url: string, 
    transformations: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpg' | 'png' | 'webp';
      crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
    } = {}
  ): string {
    if (!url.includes('imagekit.io')) {
      return url;
    }

    const params: string[] = [];
    
    if (transformations.width) params.push(`w-${transformations.width}`);
    if (transformations.height) params.push(`h-${transformations.height}`);
    if (transformations.quality) params.push(`q-${transformations.quality}`);
    if (transformations.format) params.push(`f-${transformations.format}`);
    if (transformations.crop) params.push(`c-${transformations.crop}`);

    if (params.length === 0) return url;

    const transformationString = params.join(',');
    return url.replace('/upload/', `/upload/tr:${transformationString}/`);
  }

  // Generate thumbnail URL
  static getThumbnailUrl(url: string, size: number = 100): string {
    return this.getOptimizedUrl(url, {
      width: size,
      height: size,
      crop: 'maintain_ratio',
      quality: 80,
      format: 'webp'
    });
  }
}