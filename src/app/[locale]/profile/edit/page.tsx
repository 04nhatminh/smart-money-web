'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SidebarLayout, ProtectedRoute } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, ProfileEditForm } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { MdArrowBack } from 'react-icons/md';

function ProfileEditPageContent() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();

  const handleSuccess = () => {
    // Wait a moment to show the success message, then redirect
    setTimeout(() => {
      router.push(`/${locale}/profile`);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="secondary"
          className="p-2"
          onClick={() => router.push(`/${locale}/profile`)}
        >
          <MdArrowBack size={20} />
        </Button>
        <div>
          <Heading level={1} style={{ color: colors.interactive.primary }}>
            {t('profile.editProfile')}
          </Heading>
          <Text style={{ color: colors.text.secondary }}>
            {t('profile.editProfileDescription')}
          </Text>
        </div>
      </div>

      {/* Profile Edit Form Card */}
      <Card className="p-8">
        <ProfileEditForm
          onSuccess={handleSuccess}
        />
      </Card>

      {/* Info Box */}
      <Card className="p-6">
        <Heading level={3} className="mb-4">
          {t('profile.editInfoTitle')}
        </Heading>
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.interactive.primary }} />
            <Text style={{ color: colors.text.secondary }} className="text-sm">
              {t('profile.editInfoItem1')}
            </Text>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.interactive.primary }} />
            <Text style={{ color: colors.text.secondary }} className="text-sm">
              {t('profile.editInfoItem2')}
            </Text>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: colors.interactive.primary }} />
            <Text style={{ color: colors.text.secondary }} className="text-sm">
              {t('profile.editInfoItem3')}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function ProfileEditPage() {
  return (
    <ProtectedRoute>
      <SidebarLayout>
        <ProfileEditPageContent />
      </SidebarLayout>
    </ProtectedRoute>
  );
}
