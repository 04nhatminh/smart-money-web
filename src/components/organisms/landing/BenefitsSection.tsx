'use client';

import React from 'react';
import { Heading, Text, ScrollReveal } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { FaCheck } from 'react-icons/fa';
import { formatVietnamsePrice } from '@/lib/format';

interface BenefitItemProps {
  label: string;
}

interface BenefitsProps {
  title?: string;
  benefits?: BenefitItemProps[];
}

const BenefitItem: React.FC<BenefitItemProps & { successColor: string }> = ({ label, successColor }) => {
  return (
    <div className="flex items-start gap-3">
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: successColor }}
      >
        <FaCheck className="text-white text-sm" />
      </div>
      <Text variant="body" className="pt-0.5">
        {label}
      </Text>
    </div>
  );
};

export const BenefitsSection: React.FC<BenefitsProps> = ({
  title,
  benefits,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const finalTitle = title || t('finance.benefits.title');

  const defaultBenefits: BenefitItemProps[] = benefits || [
    { label: t('finance.benefits.benefit1') },
    { label: t('finance.benefits.benefit2') },
    { label: t('finance.benefits.benefit3') },
    { label: t('finance.benefits.benefit4') },
    { label: t('finance.benefits.benefit5') },
    { label: t('finance.benefits.benefit6') },
  ];

  return (
    <section id="about" className="py-20 md:py-28 transition-colors relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.background.secondary} 0%, ${colors.background.primary} 60%, ${colors.background.secondary} 100%)` }}>
      {/* Ambient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full filter blur-[100px] md:blur-[140px] opacity-[0.16] dark:opacity-[0.24] animate-blob-1" 
          style={{ 
            backgroundColor: colors.interactive.primary,
            top: '15%',
            right: '-10%',
          }} 
        />
        <div 
          className="absolute w-[300px] md:w-[450px] h-[300px] md:h-[450px] rounded-full filter blur-[80px] md:blur-[110px] opacity-[0.14] dark:opacity-[0.20] animate-blob-2" 
          style={{ 
            backgroundColor: colors.interactive.secondary,
            bottom: '5%',
            left: '-5%',
          }} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Benefits List — slides in from the left */}
          <ScrollReveal variant="fade-left">
            <div>
              <Heading level={2}>
                {finalTitle}
              </Heading>
              <div className="space-y-4 mt-6">
                {defaultBenefits.map((benefit, index) => (
                  <ScrollReveal key={index} variant="fade-left" delay={index * 100}>
                    <BenefitItem label={benefit.label} successColor={colors.interactive.success} />
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Testimonial Card — slides in from the right */}
          <ScrollReveal variant="fade-right" delay={150}>
            <div
              className="rounded-2xl p-8 shadow-2xl backdrop-blur-md border relative z-10"
              style={{
                backgroundColor: colors.surface.primary === '#ffffff' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 12, 41, 0.75)',
                borderColor: colors.border.light,
                boxShadow: colors.surface.primary === '#ffffff' ? '0 20px 40px rgba(80, 68, 213, 0.08)' : '0 20px 40px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div className="mb-6">
                <Text variant="caption" className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                  {t('finance.testimonial.balance')}
                </Text>
                <Heading level={3} className="text-3xl font-bold mt-1">
                  {formatVietnamsePrice(25400000)}
                </Heading>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Text variant="caption" className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                    {t('finance.testimonial.date')}
                  </Text>
                  <Text className="text-lg font-semibold mt-1">
                    2026
                  </Text>
                </div>
                <div>
                  <Text variant="caption" className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                    {t('finance.testimonial.savingsGoal')}
                  </Text>
                  <Text
                    className="text-lg font-semibold mt-1"
                    style={{ color: colors.interactive.success }}
                  >
                    {formatVietnamsePrice(120000000)}
                  </Text>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
