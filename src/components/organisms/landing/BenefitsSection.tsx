'use client';

import React from 'react';
import { Heading, Text } from '@/components/atoms';
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
    <section id="about" className="py-16 md:py-24 transition-colors" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Benefits List */}
          <div>
            <Heading level={2} className="mb-8">
              {finalTitle}
            </Heading>
            <div className="space-y-4">
              {defaultBenefits.map((benefit, index) => (
                <BenefitItem key={index} label={benefit.label} successColor={colors.interactive.success} />
              ))}
            </div>
          </div>

          {/* Right: Testimonial Card */}
          <div
            className="rounded-lg p-8 shadow-lg"
            style={{
              backgroundColor: colors.surface.primary,
              borderColor: colors.border.light,
              borderWidth: '1px',
            }}
          >
            <div className="mb-6">
              <Text variant="caption" className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                {t('finance.testimonial.balance')}
              </Text>
              <Heading level={3} className="text-3xl font-bold mt-1">
                {formatVietnamsePrice(1234.56, 'VND', 2)}
              </Heading>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Text variant="caption" className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                  {t('finance.testimonial.date')}
                </Text>
                <Text className="text-lg font-semibold mt-1">
                  12/15
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
                  {formatVietnamsePrice(8943.21, 'VND', 2)}
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
