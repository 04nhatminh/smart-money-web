'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button, Heading, Text } from '@/components/atoms';
import { MdClose, MdUploadFile, MdCheckCircle, MdContentCopy } from 'react-icons/md';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface ImageBillUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type UploadState = 'idle' | 'uploading' | 'success';

export const ImageBillUploadModal: React.FC<ImageBillUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    url: string;
    file: File;
  } | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById('bill-image-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError('Please select an image');
      return;
    }

    try {
      setUploadState('uploading');
      setError(null);

      const url = await uploadImageToCloudinary(file);
      setUploadedImage({ url, file });

      // Submit to AI controller with OCR type
      await apiClient.postFormData(API_ENDPOINTS.ai.submit, {
        data: url,
        type: 'ocr',
      });

      setUploadState('success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload image';
      setError(errorMsg);
      setUploadState('idle');
    }
  };

  const handleSubmit = () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    // Reset and close
    setUploadedImage(null);
    setPreview('');
    setUploadState('idle');
    setCopiedToClipboard(false);
    onSuccess?.();
    onClose();
  };

  const handleCopyUrl = () => {
    if (uploadedImage) {
      navigator.clipboard.writeText(uploadedImage.url);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleSuccessClose = () => {
    setUploadedImage(null);
    setPreview('');
    setUploadState('idle');
    setError(null);
    setCopiedToClipboard(false);
    const fileInput = document.getElementById('bill-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    onSuccess?.();
    onClose();
  };

  const handleReset = () => {
    setUploadedImage(null);
    setPreview('');
    setError(null);
    setCopiedToClipboard(false);
    const fileInput = document.getElementById('bill-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.background.primary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Heading level={2} style={{ color: colors.text.primary }}>
            Upload Receipt/Invoice
          </Heading>
          <button
            onClick={() => {
              if (uploadState === 'success') {
                handleSuccessClose();
              } else {
                handleReset();
                onClose();
              }
            }}
            className="p-1 rounded-lg transition-colors hover:bg-opacity-80"
            style={{ color: colors.text.secondary }}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              borderLeft: '4px solid #DC2626',
            }}
          >
            <Text className="text-sm">{error}</Text>
          </div>
        )}

        {/* Upload Preview Section */}
        {uploadState === 'idle' && (
          <div>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center mb-6"
              style={{
                borderColor: colors.border.light,
                backgroundColor: colors.surface.secondary,
              }}
            >
              <input
                id="bill-image-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {preview ? (
                <div>
                  <img src={preview} alt="Preview" className="max-w-full max-h-64 mx-auto mb-4 rounded-lg" />
                  <Text style={{ color: colors.text.secondary }} className="text-sm">
                    Image selected, ready to upload
                  </Text>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById('bill-image-input')?.click()}
                  className="flex flex-col items-center justify-center w-full hover:opacity-80 hover:cursor-pointer"
                >
                  <MdUploadFile className="w-12 h-12 mb-2" style={{ color: colors.interactive.primary }} />
                  <Text style={{ color: colors.text.primary }} className="font-semibold">
                    Click to select image
                  </Text>
                  <Text style={{ color: colors.text.secondary }} className="text-xs mt-1">
                    or drag and drop
                  </Text>
                  <Text style={{ color: colors.text.tertiary }} className="text-xs mt-2">
                    JPG, PNG, WebP (max 5MB)
                  </Text>
                </button>
              )}
            </div>

            {/* Upload Button */}
            {preview && (
              <div className="flex gap-2">
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: colors.interactive.primary,
                    color: '#ffffff',
                  }}
                >
                  Upload
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 rounded-lg font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: colors.border.light,
                    color: colors.text.primary,
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Uploading State */}
        {uploadState === 'uploading' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 animate-spin" style={{ backgroundColor: `${colors.interactive.primary}20` }}>
              <div className="w-8 h-8 rounded-full border-4 border-transparent" style={{ borderTopColor: colors.interactive.primary }}></div>
            </div>
            <Text style={{ color: colors.text.primary }} className="font-semibold">
              Uploading image...
            </Text>
          </div>
        )}

        {/* Success State */}
        {uploadState === 'success' && uploadedImage && (
          <div>
            {/* Success Message */}
            <div className="text-center mb-6">
              <MdCheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
              <Heading level={3} style={{ color: colors.text.primary }} className="mb-2">
                Upload Successful!
              </Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Your image has been uploaded.
              </Text>
            </div>

            {/* Uploaded Image Preview */}
            <img src={uploadedImage.url} alt="Uploaded" className="w-full max-h-64 object-cover rounded-lg mb-6" />

            {/* Image URL Display */}
            <div
              className="p-4 rounded-lg mb-6 break-all text-left"
              style={{
                backgroundColor: colors.background.secondary,
                borderLeft: `4px solid ${colors.interactive.primary}`,
              }}
            >
              <Text className="text-xs font-semibold mb-2" style={{ color: colors.text.secondary }}>
                Image URL:
              </Text>
              <Text className="text-sm font-mono" style={{ color: colors.text.primary }}>
                {uploadedImage.url}
              </Text>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleCopyUrl}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: copiedToClipboard ? '#10B981' : colors.interactive.primary,
                  color: '#ffffff',
                }}
              >
                <MdContentCopy className="w-5 h-5" />
                {copiedToClipboard ? 'Copied!' : 'Copy URL'}
              </button>
              <button
                onClick={handleSuccessClose}
                className="flex-1 px-4 py-2 rounded-lg font-medium border transition-all"
                style={{
                  borderColor: colors.border.light,
                  color: colors.text.primary,
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
