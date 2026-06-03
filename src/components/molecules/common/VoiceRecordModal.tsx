'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Button, Heading, Text } from '@/components/atoms';
import { MdClose, MdFiberManualRecord, MdStopCircle, MdPlayArrow, MdCheckCircle } from 'react-icons/md';
import { uploadAudioToCloudinary } from '@/lib/cloudinary';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { useWebSocket } from '@/context/WebSocketContext';

interface VoiceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onAIResultReceived?: (result: Record<string, any>, source?: 'image' | 'voice') => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded' | 'playing' | 'uploading' | 'processing' | 'success';

export const VoiceRecordModal: React.FC<VoiceRecordModalProps> = ({ isOpen, onClose, onSuccess, onAIResultReceived }) => {
  const { colors } = useTheme();
  const [state, setState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<Record<string, any> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const { subscribe } = useWebSocket();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setState('recorded');

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setState('recording');
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMsg);
      setState('idle');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const handlePlayAudio = async () => {
    if (!audioElementRef.current) {
      setError('Audio element not found');
      return;
    }

    try {
      setState('playing');
      await audioElementRef.current.play();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to play audio';
      setError(errorMsg);
      setState('recorded');
    }
  };

  const handleReset = () => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setAudioUrl('');
    setRecordingTime(0);
    setState('idle');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!audioUrl) {
      setError('Please record a voice first');
      return;
    }

    try {
      setState('uploading');
      setError(null);

      // Convert blob URL to File
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

      // Upload to Cloudinary
      const url = await uploadAudioToCloudinary(file);

      // Submit to AI controller with voice type
      const apiResponse = await apiClient.postFormData<any>(API_ENDPOINTS.ai.submit, {
        data: url,
        type: 'voice',
      });

      const id = apiResponse.jobId;
      setJobId(id);
      setState('processing');

      // Subscribe to WebSocket for AI result
      // cleanup subscription cũ nếu user submit lại
      unsubscribeRef.current?.();

      const unsubscribeFn = subscribe(id, (result) => {
        unsubscribeFn();
        unsubscribeRef.current = null;

        if (result.error) {
          setError(result.error);
          setState('recorded');
          return;
        }

        if (onAIResultReceived) {
          // Call the callback with the AI result and source type
          onAIResultReceived(result, 'voice');
          // Close the modal
          handleSuccessClose();
        } else {
          // Fall back to showing success state if no callback
          setAiResult(result);
          setState('success');
        }
      });

      unsubscribeRef.current = unsubscribeFn;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload audio';
      setError(errorMsg);
      setState('recorded');
    }
  };

  const handleSuccessClose = () => {
    // Unsubscribe from WebSocket
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    // Reset and close
    setAudioUrl('');
    setRecordingTime(0);
    setState('idle');
    setError(null);
    setJobId(null);
    setAiResult(null);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            Record Voice
          </Heading>
          <button
            onClick={() => {
              if (state === 'success') {
                handleSuccessClose();
              } else {
                // Reset before closing from other states
                if (state !== 'idle') {
                  handleReset();
                }
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

        {/* Recording Section */}
        <div
          className="p-8 rounded-lg mb-6 text-center"
          style={{
            backgroundColor: colors.surface.secondary,
          }}
        >
          {state === 'idle' && (
            <div>
              <Text style={{ color: colors.text.secondary }} className="text-sm mb-4">
                Click the button below to start recording
              </Text>
              <button
                onClick={handleStartRecording}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-4 rounded-full font-semibold transition-all hover:opacity-80 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: colors.interactive.primary,
                  color: '#ffffff',
                }}
              >
                <MdFiberManualRecord className="w-6 h-6" />
                Start Recording
              </button>
            </div>
          )}

          {state === 'recording' && (
            <div>
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#FEE2E2' }}>
                  <MdFiberManualRecord className="w-4 h-4" style={{ color: '#DC2626' }} />
                  <Text style={{ color: '#991B1B' }} className="font-mono font-semibold">
                    {formatTime(recordingTime)}
                  </Text>
                </div>
              </div>
              <button
                onClick={handleStopRecording}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-4 rounded-full font-semibold transition-all hover:opacity-80 hover:cursor-pointer"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#ffffff',
                }}
              >
                <MdStopCircle className="w-6 h-6" />
                Stop Recording
              </button>
            </div>
          )}

          {state === 'recorded' && (
            <div>
              <MdCheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#10B981' }} />
              <Text style={{ color: colors.text.primary }} className="font-semibold mb-4">
                Recording Complete
              </Text>
              <Text style={{ color: colors.text.secondary }} className="text-sm mb-6">
                Duration: {formatTime(recordingTime)}
              </Text>
              <button
                onClick={handlePlayAudio}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-full font-semibold transition-all hover:opacity-80 hover:cursor-pointer"
                style={{
                  backgroundColor: colors.interactive.primary,
                  color: '#ffffff',
                }}
              >
                <MdPlayArrow className="w-6 h-6" />
                Listen Again
              </button>
            </div>
          )}

          {state === 'playing' && (
            <div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Playing audio...
              </Text>
            </div>
          )}

          {state === 'uploading' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 animate-spin" style={{ backgroundColor: `${colors.interactive.primary}20` }}>
                <div className="w-8 h-8 rounded-full border-4 border-transparent" style={{ borderTopColor: colors.interactive.primary }}></div>
              </div>
              <Text style={{ color: colors.text.primary }} className="font-semibold">
                Uploading voice...
              </Text>
            </div>
          )}

          {state === 'processing' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 animate-spin" style={{ backgroundColor: `${colors.interactive.primary}20` }}>
                <div className="w-8 h-8 rounded-full border-4 border-transparent" style={{ borderTopColor: colors.interactive.primary }}></div>
              </div>
              <Text style={{ color: colors.text.primary }} className="font-semibold">
                Processing your voice...
              </Text>
              <Text style={{ color: colors.text.secondary }} className="text-sm mt-2">
                This may take a few seconds
              </Text>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center">
              <MdCheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#10B981' }} />
              <Heading level={3} style={{ color: colors.text.primary }} className="mb-2">
                Analysis Complete!
              </Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm mb-6">
                Your voice recording has been successfully analyzed and uploaded.
              </Text>
              
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

          {/* Audio Element - Always mounted */}
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setState('recorded')}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        {state === 'recorded' && (
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: colors.interactive.primary,
                color: '#ffffff',
              }}
            >
              Submit
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 rounded-lg font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: colors.border.light,
                color: colors.text.primary,
              }}
            >
              Record Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
