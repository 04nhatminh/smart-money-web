import type { ApiResponse } from './base.api';

// ============ Media Upload ============
// For image and voice uploads that get analyzed by AI Agent

export interface UploadImageRequest {
  imageUrl: string;
}

export interface UploadVoiceRequest {
  voiceUrl: string;
}

export interface MediaAnalysisResponse {
  id?: string;
  success: boolean;
  message: string;
  transactionId?: string;
  detectedData?: {
    amount?: number;
    category?: string;
    description?: string;
    type?: 'INCOME' | 'EXPENSE';
  };
}

export type UploadImageResponse = ApiResponse<MediaAnalysisResponse>;
export type UploadVoiceResponse = ApiResponse<MediaAnalysisResponse>;
