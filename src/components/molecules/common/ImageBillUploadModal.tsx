'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button, Heading, Text, Alert } from '@/components/atoms';
import { MdClose, MdUploadFile, MdCheckCircle, MdContentCopy } from 'react-icons/md';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { useWebSocket } from '@/context/WebSocketContext';

interface ImageBillUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onAIResultReceived?: (result: Record<string, any>, source?: 'image' | 'voice') => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'success';

export const ImageBillUploadModal: React.FC<ImageBillUploadModalProps> = ({ isOpen, onClose, onSuccess, onAIResultReceived }) => {
  const { colors } = useTheme();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{
    url: string;
    file: File;
  } | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<Record<string, any> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { subscribe } = useWebSocket();

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
      const response = await apiClient.postFormData<any>(API_ENDPOINTS.ai.submit, {
        data: url,
        type: 'ocr',
      });

      const id = response.jobId;
      setJobId(id);
      setUploadState('processing');

      // Subscribe to WebSocket for AI result
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      const unsubscribeFn = subscribe(id, (result) => {
        if (result.status === 'FAILED' || result.status === 'ERROR' || result.error) {
          setError(result.error || 'Failed to analyze receipt. Please try again.');
          setUploadState('idle');
          unsubscribeFn();
          unsubscribeRef.current = null;
          return;
        }

        if (onAIResultReceived) {
          // Call the callback with the AI result and source type
          onAIResultReceived(result, 'image');
          // Close the modal
          handleSuccessClose();
        } else {
          // Fall back to showing success state if no callback
          setAiResult(result);
          setUploadState('success');
        }

        unsubscribeFn();
        unsubscribeRef.current = null;
      });

      unsubscribeRef.current = unsubscribeFn;
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
    // Unsubscribe from WebSocket
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    setUploadedImage(null);
    setPreview('');
    setUploadState('idle');
    setError(null);
    setJobId(null);
    setAiResult(null);
    setCopiedToClipboard(false);
    const fileInput = document.getElementById('bill-image-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    onSuccess?.();
    onClose();
  };

  // Cleanup WebSocket subscription when modal closes
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  if (!isOpen) return null;

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
        className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: colors.background.primary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Heading level={3}>
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
            className="p-1 rounded-lg transition-colors hover:bg-opacity-80 hover:cursor-pointer"
            style={{ color: colors.text.secondary }}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert message={error} type="error" onClose={() => setError(null)} className="mb-4" />
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

        {/* Processing State - AI Analysis */}
        {uploadState === 'processing' && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 animate-spin" style={{ backgroundColor: `${colors.interactive.primary}20` }}>
              <div className="w-8 h-8 rounded-full border-4 border-transparent" style={{ borderTopColor: colors.interactive.primary }}></div>
            </div>
            <Text style={{ color: colors.text.primary }} className="font-semibold">
              Analyzing your receipt...
            </Text>
            <Text style={{ color: colors.text.secondary }} className="text-sm mt-2">
              This may take a few seconds
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
                Analysis Complete!
              </Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Your receipt has been successfully analyzed and uploaded.
              </Text>
            </div>

            {/* Uploaded Image Preview */}
            <img src={uploadedImage.url} alt="Uploaded" className="w-full max-h-64 object-cover rounded-lg mb-6" />

            {/* AI Analysis Result Display */}
            {aiResult && (
              <div
                className="p-4 rounded-lg mb-6 text-left max-h-64 overflow-y-auto"
                style={{
                  backgroundColor: colors.background.secondary,
                  borderLeft: `4px solid ${colors.interactive.primary}`,
                }}
              >
                <Text className="text-xs font-semibold mb-3" style={{ color: colors.text.secondary }}>
                  Analysis Result:
                </Text>
                <pre
                  className="text-xs font-mono whitespace-pre-wrap break-words"
                  style={{ color: colors.text.primary }}
                >
                  {JSON.stringify(aiResult, null, 2)}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSuccessClose}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: colors.interactive.primary,
                  color: '#ffffff',
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
