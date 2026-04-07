/**
 * Cloudinary upload utility
 * Uploads files to Cloudinary and returns the secure URL
 */

interface CloudinaryResponse {
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: string;
  type: string;
  bytes: number;
  format: string;
  created_at: string;
}

// Configuration - Update these values based on your Cloudinary account
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '';

/**
 * Upload image to Cloudinary
 * @param file - Image file to upload
 * @param folder - Folder in Cloudinary (optional)
 * @returns Promise with the secure URL of uploaded image
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder: string = 'transactions/images'
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in your environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data: CloudinaryResponse = await response.json();
    return data.secure_url;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
    throw new Error(`Image upload error: ${errorMsg}`);
  }
};

/**
 * Upload audio to Cloudinary
 * @param file - Audio file to upload
 * @param folder - Folder in Cloudinary (optional)
 * @returns Promise with the secure URL of uploaded audio
 */
export const uploadAudioToCloudinary = async (
  file: File | Blob,
  folder: string = 'transactions/voice'
): Promise<string> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in your environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('resource_type', 'auto');

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }

    const data: CloudinaryResponse = await response.json();
    return data.secure_url;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to upload audio';
    throw new Error(`Audio upload error: ${errorMsg}`);
  }
};
