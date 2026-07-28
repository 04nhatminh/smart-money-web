'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';

export default function TermsPage() {
  const t = useTranslations();
  const { colors } = useTheme();

  const sections = [
    {
      title: t('termsPage.sec1Title'),
      content: t('termsPage.sec1Desc'),
    },
    {
      title: t('termsPage.sec2Title'),
      content: t('termsPage.sec2Desc'),
    },
    {
      title: t('termsPage.sec3Title'),
      content: t('termsPage.sec3Desc'),
    },
    {
      title: t('termsPage.sec4Title'),
      content: t('termsPage.sec4Desc'),
    },
  ];

  return (
    <MainLayout title={t('common.terms') || 'Terms of Service'}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <Heading level={1} className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: colors.text.primary }}>
            {t('common.terms') || 'Terms of Service'}
          </Heading>
          <Text className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
            {t('termsPage.subtitle')}
          </Text>
        </div>

        <div className="space-y-8">
          {sections.map((sec, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.light,
              }}
            >
              <Heading level={2} className="text-xl font-bold mb-3" style={{ color: colors.text.primary }}>
                {sec.title}
              </Heading>
              <Text className="leading-relaxed" style={{ color: colors.text.secondary }}>
                {sec.content}
              </Text>
            </div>
          ))}
        </div>

        <div
          className="mt-12 p-6 rounded-xl border text-center"
          style={{
            backgroundColor: colors.surface.primary,
            borderColor: colors.border.light,
          }}
        >
          <Text className="font-semibold" style={{ color: colors.text.primary }}>
            {t('termsPage.questions')}
          </Text>
          <Text className="mt-2" style={{ color: colors.text.secondary }}>
            {t('termsPage.contactSupport', { email: process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'legal@smartmoney.vn' })}
          </Text>
        </div>
      </div>
    </MainLayout>
  );
}
