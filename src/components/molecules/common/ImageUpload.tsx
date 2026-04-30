'use client';

import React, { useRef, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Text } from '@/components/atoms';
import { MdClose, MdImage, MdCheck } from 'react-icons/md';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface ImageUploadProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  maxFileSize?: number; // in bytes, default 5MB
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onSuccess,
  onError,
  maxFileSize = 5 * 1024 * 1024,
}) => {
  const { colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size must be less than ${maxFileSize / (1024 * 1024)}MB`;
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select a valid image file';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      setIsUploading(true);
      setErrorMessage(null);

      const imageUrl = await uploadImageToCloudinary(file);

      // Send image link to backend for analysis
      setIsAnalyzing(true);
      await apiClient.post(API_ENDPOINTS.media.uploadImage, {
        imageUrl,
      });

      setSuccessMessage('Image uploaded and submitted for analysis.');
      setPreview(null);
      onSuccess?.();

      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
      setPreview(null);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>
        Upload Transaction Image
      </label>

      {/* Success Message */}
      {successMessage && (
        <div
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{
            backgroundColor: `${colors.interactive.success}20`,
            color: colors.interactive.success,
          }}
        >
          <MdCheck className="w-5 h-5 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: `${colors.interactive.danger}20`,
            color: colors.interactive.danger,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border"
            style={{ borderColor: colors.border.light }}
          />
        </div>
      )}

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
        style={{
          borderColor: colors.border.light,
          backgroundColor: `${colors.surface.secondary}40`,
          opacity: isUploading || isAnalyzing ? 0.6 : 1,
          pointerEvents: isUploading || isAnalyzing ? 'none' : 'auto',
        }}
        onClick={() => !isUploading && !isAnalyzing && fileInputRef.current?.click()}
      >
        <MdImage className="w-8 h-8 mx-auto mb-2" style={{ color: colors.text.secondary }} />
        <Text className="font-medium mb-1" style={{ color: colors.text.primary }}>
          {isUploading
            ? 'Uploading...'
            : isAnalyzing
              ? 'Submitting for analysis...'
              : 'Click or drag to upload receipt image'}
        </Text>
        <Text className="text-xs" style={{ color: colors.text.secondary }}>
          Max file size: {maxFileSize / (1024 * 1024)}MB
        </Text>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        hidden
        disabled={isUploading || isAnalyzing}
      />
    </div>
  );
};
