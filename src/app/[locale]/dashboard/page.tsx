'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute, MainLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { LogoutButton } from '@/components/molecules/auth';
import { Card } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <Heading level={1} style={{ color: colors.interactive.primary }}>
              Welcome back, {user?.fullName || user?.username || 'User'}! 👋
            </Heading>
            <Text style={{ color: colors.text.secondary }}>
              Manage and track your finances with ease
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <div className="md:col-span-1">
              <Card className="p-6 h-full">
                <div className="text-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.fullName || user.username} 
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div 
                      className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white"
                      style={{ backgroundColor: colors.interactive.primary }}
                    >
                      {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <Heading level={3} className="mb-2">
                    {user?.fullName || user?.username}
                  </Heading>
                  <p 
                    className="text-sm mb-4 break-all"
                    style={{ color: colors.text.secondary }}
                  >
                    {user?.email}
                  </p>
                  {user?.coin !== undefined && (
                    <div 
                      className="p-3 rounded-lg mb-4"
                      style={{ backgroundColor: colors.surface.secondary }}
                    >
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        Coins Balance
                      </p>
                      <p className="text-2xl font-bold" style={{ color: colors.interactive.primary }}>
                        {user.coin}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Account Information Card */}
            <div className="md:col-span-2">
              <Card className="p-6">
                <Heading level={3} className="mb-6">Account Information</Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                      Username
                    </p>
                    <p className="text-lg font-semibold">{user?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                      Email
                    </p>
                    <p className="text-lg font-semibold break-all">{user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                      Phone
                    </p>
                    <p className="text-lg font-semibold">{user?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                      Date of Birth
                    </p>
                    <p className="text-lg font-semibold">{formatDate(user?.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                      User ID
                    </p>
                    <p className="text-lg font-semibold break-all text-sm">{user?.id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: colors.text.secondary }}>
                      Role
                    </p>
                    <p className="text-lg font-semibold capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Features Coming Soon */}
          <Card className="p-6">
            <Heading level={3} className="mb-4">Features Coming Soon</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '💰', title: 'Transaction Management', desc: 'Track all your income and expenses' },
                { icon: '🎯', title: 'Savings Goals', desc: 'Set and achieve your financial goals' },
                { icon: '📊', title: 'Financial Analytics', desc: 'Get insights into your spending habits' },
                { icon: '💼', title: 'Budget Tracking', desc: 'Monitor your budget in real-time' },
                { icon: '📈', title: 'Reports & Insights', desc: 'Generate detailed financial reports' },
                { icon: '🤖', title: 'AI-Powered Insights', desc: 'Get smart recommendations' },
              ].map((feature, idx) => (
                <div key={idx} className="p-4 rounded-lg" style={{ backgroundColor: colors.surface.secondary }}>
                  <p className="text-2xl mb-2">{feature.icon}</p>
                  <p className="font-semibold">{feature.title}</p>
                  <p className="text-sm" style={{ color: colors.text.secondary }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              variant="primary"
              onClick={() => router.push(`/${locale}/dashboard`)}
            >
              Refresh
            </Button>
            <LogoutButton 
              variant="secondary"
            >
              Logout
            </LogoutButton>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
