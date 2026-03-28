'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute, MainLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { LogoutButton } from '@/components/molecules/auth';
import { Card } from '@/components/molecules/common';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <Heading level={1}>
              Welcome, {user?.username || 'User'}!
            </Heading>
            <Text>Dashboard - Manage your finances</Text>
          </div>

          {/* User Info Card */}
          <Card className="p-6">
            <Heading level={3} className="mb-4">Account Information</Heading>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="font-semibold">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">User ID</p>
                <p className="font-semibold">{user?.id}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <Heading level={3} className="mb-4">Quick Actions</Heading>
            <div className="flex gap-2">
              <LogoutButton 
                variant="danger"
                onSuccess={() => router.push('/login')}
              >
                Logout
              </LogoutButton>
            </div>
          </Card>

          {/* Placeholder Content */}
          <Card className="p-6">
            <Heading level={3} className="mb-4">Features Coming Soon</Heading>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Transaction Management</li>
              <li>Savings Goals</li>
              <li>Financial Analytics</li>
              <li>Budget Tracking</li>
              <li>Reports & Insights</li>
            </ul>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
