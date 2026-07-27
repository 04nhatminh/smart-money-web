'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FiSmartphone, FiDownload, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';
import { Heading, Text, Button, ScrollReveal } from '@/components/atoms';
import { useTheme } from '@/context';

interface AppDownloadSectionProps {
  downloadUrl?: string;
  title?: string;
  subtitle?: string;
  downloadButtonText?: string;
}

export const AppDownloadSection: React.FC<AppDownloadSectionProps> = ({
  downloadUrl = '#',
  title,
  subtitle,
  downloadButtonText,
}) => {
  const { colors, colorScheme } = useTheme();
  const t = useTranslations();

  const finalTitle = title || t('finance.mobileApp.title');
  const finalSubtitle = subtitle || t('finance.mobileApp.subtitle');
  const finalButtonText = downloadButtonText || t('finance.mobileApp.downloadButton');

  // Fallback translation strings with defaults if keys aren't added yet
  const badgeText = t.has('finance.mobileApp.badge') ? t('finance.mobileApp.badge') : 'Ứng Dụng Di Động';
  const downloadNote = t.has('finance.mobileApp.downloadNote') ? t('finance.mobileApp.downloadNote') : 'Tải trực tiếp file cài đặt / Web Store chính thức';
  const qrTitle = t.has('finance.mobileApp.qrTitle') ? t('finance.mobileApp.qrTitle') : 'Quét mã để tải app';
  const qrSubtitle = t.has('finance.mobileApp.qrSubtitle') ? t('finance.mobileApp.qrSubtitle') : 'Mở camera điện thoại quét mã bên dưới';
  const feature1 = t.has('finance.mobileApp.feature1') ? t('finance.mobileApp.feature1') : 'Ghi chép nhanh bằng Giọng nói & Camera OCR';
  const feature2 = t.has('finance.mobileApp.feature2') ? t('finance.mobileApp.feature2') : 'Thông báo & Cảnh báo ngân sách tức thì';
  const feature3 = t.has('finance.mobileApp.feature3') ? t('finance.mobileApp.feature3') : 'Đồng bộ dữ liệu tài chính thời gian thực';

  const isDark = colorScheme === 'dark';

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    downloadUrl !== '#' ? downloadUrl : 'https://example.com/app-download'
  )}`;

  return (
    <section 
      className="py-16 md:py-24 relative overflow-hidden transition-colors"
      style={{ 
        backgroundColor: colors.background.secondary,
        borderTop: `1px solid ${colors.border.light || 'rgba(255,255,255,0.05)'}`,
        borderBottom: `1px solid ${colors.border.light || 'rgba(255,255,255,0.05)'}`
      }}
    >
      {/* Background Accent Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: colors.palette.base }}
      />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: colors.palette[500] || colors.palette.base }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div 
          className="rounded-3xl p-8 md:p-12 lg:p-14 shadow-2xl transition-all border"
          style={{ 
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : colors.background.primary,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Main Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <ScrollReveal variant="fade-up" delay={0}>
                <div 
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium border"
                  style={{ 
                    backgroundColor: colors.palette[100] || 'rgba(59, 130, 246, 0.1)',
                    color: colors.palette.base,
                    borderColor: colors.palette[200] || 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <FiSmartphone className="w-4 h-4" />
                  <span>{badgeText}</span>
                </div>
              </ScrollReveal>

              {/* Title & Subtitle */}
              <ScrollReveal variant="fade-up" delay={100}>
                <Heading 
                  level={2} 
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                  style={{ color: colors.text.primary }}
                >
                  {finalTitle}
                </Heading>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={200}>
                <Text 
                  variant="body" 
                  className="text-base md:text-lg leading-relaxed max-w-2xl"
                  style={{ color: colors.text.secondary }}
                >
                  {finalSubtitle}
                </Text>
              </ScrollReveal>

              {/* Key Features Bullet Points */}
              <ScrollReveal variant="fade-up" delay={300}>
                <ul className="space-y-3 pt-2">
                  {[feature1, feature2, feature3].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: colors.palette[100] || 'rgba(59, 130, 246, 0.15)', color: colors.palette.base }}
                      >
                        <FiCheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm md:text-base font-medium" style={{ color: colors.text.primary }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollReveal>

              {/* Download Action Group */}
              <ScrollReveal variant="fade-up" delay={400}>
                <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className="font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-3 px-6 py-3.5"
                    >
                      <FiDownload className="w-5 h-5" />
                      <span>{finalButtonText}</span>
                      <FiExternalLink className="w-4 h-4 opacity-75 ml-1" />
                    </Button>
                  </a>

                  <span className="text-xs md:text-sm italic" style={{ color: colors.text.tertiary }}>
                    {downloadNote}
                  </span>
                </div>
              </ScrollReveal>
            </div>

            {/* QR Code Container (Right Column) */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal variant="zoom-in" delay={300}>
                <div 
                  className="p-6 md:p-8 rounded-2xl border text-center flex flex-col items-center shadow-lg transition-all transform hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <MdQrCode2 className="w-6 h-6" style={{ color: colors.palette.base }} />
                    <span className="font-semibold text-sm md:text-base" style={{ color: colors.text.primary }}>
                      {qrTitle}
                    </span>
                  </div>

                  {/* QR Code Image Container */}
                  <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-200 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrImageUrl} 
                      alt="Mobile App QR Code"
                      className="w-40 h-40 md:w-44 md:h-44 object-contain rounded"
                    />
                  </div>

                  <p className="text-xs max-w-[200px]" style={{ color: colors.text.tertiary }}>
                    {qrSubtitle}
                  </p>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
