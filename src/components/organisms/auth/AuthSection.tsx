'use client';

import React from 'react';
import { LoginForm } from '@/components/molecules';

interface AuthSectionProps {
  onSuccess?: (token: string) => void;
  error?: string;
}

export const AuthSection: React.FC<AuthSectionProps> = ({
  onSuccess,
  error,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          Sign In
        </h2>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        <LoginForm onSuccess={onSuccess} />
        <p className="text-center text-gray-600 text-sm mt-4">
          Don't have an account yet?
        </p>
      </div>
    </div>
  );
};
