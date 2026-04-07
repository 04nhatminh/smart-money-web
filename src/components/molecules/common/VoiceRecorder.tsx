'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Text } from '@/components/atoms';
import { MdMic, MdStop, MdDelete, MdCheck, MdError } from 'react-icons/md';
import { uploadAudioToCloudinary } from '@/lib/cloudinary';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';

interface VoiceRecorderProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  maxRecordingDuration?: number; // in seconds, default 60
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSuccess,
  onError,
  maxRecordingDuration = 60,
}) => {
  const { colors } = useTheme();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const startRecording = async () => {
    try {
      setPermissionDenied(false);
      setErrorMessage(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        // Auto upload to Cloudinary and send link to backend
        try {
          setIsUploading(true);
          const voiceUrl = await uploadAudioToCloudinary(audioBlob);

          // Send voice link to backend for analysis
          await apiClient.post(API_ENDPOINTS.media.uploadVoice, {
            voiceUrl,
          });

          setSuccessMessage('Voice uploaded and submitted for analysis. AI Agent will process it.');
          onSuccess?.();

          // Clear message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to upload voice';
          setErrorMessage(errorMsg);
          onError?.(errorMsg);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= maxRecordingDuration) {
            stopRecording();
            return maxRecordingDuration;
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to access microphone';
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
        setPermissionDenied(true);
        onError?.('Microphone permission denied. Please enable it in your browser settings.');
      } else {
        setErrorMessage(errorMsg);
        onError?.(errorMsg);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Stop microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    }
  };

  const handleRemoveAudio = () => {
    setAudioPreviewUrl(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setRecordingDuration(0);

    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>
        Record Transaction Voice
      </label>

      {/* Permission Denied Message */}
      {permissionDenied && (
        <div
          className="p-3 rounded-lg text-sm flex items-center gap-2"
          style={{
            backgroundColor: `${colors.interactive.danger}20`,
            color: colors.interactive.danger,
          }}
        >
          <MdError className="w-5 h-5 flex-shrink-0" />
          <span>Microphone permission denied. Enable it in browser settings.</span>
        </div>
      )}

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
      {errorMessage && !permissionDenied && (
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

      {/* Recording Controls */}
      {!audioPreviewUrl && (
        <>
          {isRecording && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{
                borderColor: colors.border.light,
                backgroundColor: `${colors.interactive.danger}10`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="p-2 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.interactive.danger }}
                  >
                    <MdMic className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <Text className="font-medium" style={{ color: colors.text.primary }}>
                      Recording...
                    </Text>
                    <Text className="text-xs" style={{ color: colors.text.secondary }}>
                      {formatDuration(recordingDuration)} / {formatDuration(maxRecordingDuration)}
                    </Text>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                style={{
                  backgroundColor: colors.interactive.danger,
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <MdStop className="w-5 h-5" />
                Stop Recording
              </button>
            </div>
          )}

          {!isRecording && !audioPreviewUrl && (
            <button
              type="button"
              onClick={startRecording}
              disabled={permissionDenied}
              className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{
                backgroundColor: colors.interactive.primary,
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                if (!permissionDenied) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <MdMic className="w-5 h-5" />
              Start Recording
            </button>
          )}

          {isUploading && (
            <div
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: colors.surface.secondary,
                color: colors.text.secondary,
              }}
            >
              <Text className="font-medium">Uploading voice and submitting for analysis...</Text>
            </div>
          )}
        </>
      )}

      {/* Audio Playback */}
      {audioPreviewUrl && !isUploading && (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{
            borderColor: colors.border.light,
            backgroundColor: colors.surface.secondary,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-full"
              style={{ backgroundColor: colors.interactive.success }}
            >
              <MdCheck className="w-4 h-4 text-white" />
            </div>
            <Text className="font-medium" style={{ color: colors.text.primary }}>
              Voice recorded
            </Text>
          </div>

          {/* Audio Player */}
          <audio
            src={audioPreviewUrl}
            controls
            className="w-full h-8 rounded"
            style={{
              backgroundColor: colors.surface.primary,
            }}
          />

          <button
            type="button"
            onClick={handleRemoveAudio}
            className="text-sm font-medium px-3 py-2 rounded transition-colors"
            style={{
              color: colors.interactive.danger,
              backgroundColor: `${colors.interactive.danger}10`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = `${colors.interactive.danger}20`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = `${colors.interactive.danger}10`)
            }
          >
            Clear Recording
          </button>
        </div>
      )}
    </div>
  );
};
