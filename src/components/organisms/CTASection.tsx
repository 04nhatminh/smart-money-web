'use client';

import React from 'react';
import { Heading, Text, Button } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { PRIMARY_COLORS } from '@/constants/colors';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  title,
  subtitle,
  buttonText,
  onButtonClick,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const finalTitle = title || t('finance.cta.title');
  const finalSubtitle = subtitle || t('finance.cta.subtitle');
  const finalButtonText = buttonText || t('finance.cta.button');

  return (
    <section
      className="py-16 md:py-24 transition-colors"
      style={{ backgroundColor: PRIMARY_COLORS.base }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <Heading level={2} className="mb-4 text-white text-3xl md:text-4xl">
          {finalTitle}
        </Heading>

        {/* Subtitle */}
        <Text
          variant="body"
          className="mb-8 text-lg text-white opacity-90"
        >
          {finalSubtitle}
        </Text>

        {/* Button */}
        <Button
          variant="secondary"
          size="lg"
          onClick={onButtonClick}
          className="font-semibold"
        >
          {finalButtonText}
        </Button>
      </div>
    </section>
  );
};
