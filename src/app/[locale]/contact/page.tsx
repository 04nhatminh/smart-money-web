'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { MainLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { useTheme } from '@/context';

export default function ContactPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { colors } = useTheme();
  
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@smartmoney.vn';
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || '+84 24 1234 5678';
  const address = locale === 'vi' 
    ? (process.env.NEXT_PUBLIC_CONTACT_ADDRESS_VI || 'Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội') 
    : (process.env.NEXT_PUBLIC_CONTACT_ADDRESS_EN || 'Hoa Lac High Tech Park, Thach That, Hanoi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.name && formState.email && formState.message) {
      setSubmitted(true);
      setFormState({ name: '', email: '', message: '' });
    }
  };

  return (
    <MainLayout title={t('common.contact')}>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <Heading level={1} className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: colors.text.primary }}>
            {t('common.contact')}
          </Heading>
          <Text className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
            {t('contactPage.subtitle')}
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div 
            className="p-8 rounded-2xl border"
            style={{ 
              backgroundColor: colors.background.secondary, 
              borderColor: colors.border.light 
            }}
          >
            <Heading level={2} className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
              {t('contactPage.formTitle')}
            </Heading>

            {submitted ? (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center mb-6">
                {t('contactPage.successMessage')}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  {t('contactPage.fullNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('contactPage.fullNamePlaceholder')}
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder={t('contactPage.emailPlaceholder')}
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.primary }}>
                  {t('contactPage.messageLabel')}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={t('contactPage.messagePlaceholder')}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-opacity-50"
                  style={{ 
                    backgroundColor: colors.background.primary, 
                    borderColor: colors.border.light,
                    color: colors.text.primary
                  }}
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-3">
                {t('contactPage.submitBtn')}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="flex flex-col justify-between py-4">
            <div className="space-y-8">
              <div>
                <Heading level={2} className="text-2xl font-bold mb-4" style={{ color: colors.text.primary }}>
                  {t('contactPage.infoTitle')}
                </Heading>
                <Text style={{ color: colors.text.secondary }} className="leading-relaxed">
                  {t('contactPage.infoDesc')}
                </Text>
              </div>

              <div className="space-y-4">
                {/* Email Section */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 mt-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <Text className="font-semibold" style={{ color: colors.text.primary }}>Email</Text>
                    <Text style={{ color: colors.text.secondary }}>{email}</Text>
                  </div>
                </div>

                {/* Phone Section */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 mt-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <Text className="font-semibold" style={{ color: colors.text.primary }}>{t('contactPage.phoneLabel')}</Text>
                    <Text style={{ color: colors.text.secondary }}>{phone}</Text>
                  </div>
                </div>

                {/* Address Section */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 mt-1">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <Text className="font-semibold" style={{ color: colors.text.primary }}>{t('contactPage.addressLabel')}</Text>
                    <Text style={{ color: colors.text.secondary }}>{address}</Text>
                  </div>
                </div>
              </div>
            </div>

            <div 
              className="mt-8 p-6 rounded-xl border"
              style={{ 
                backgroundColor: colors.background.secondary, 
                borderColor: colors.border.light 
              }}
            >
              <Text className="font-semibold" style={{ color: colors.text.primary }}>
                {t('contactPage.workingHoursLabel')}
              </Text>
              <Text className="mt-1" style={{ color: colors.text.secondary }}>
                {t('contactPage.workingHoursVal')}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
