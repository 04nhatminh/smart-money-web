'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Heading, Text, Button } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { FiArrowRight } from 'react-icons/fi';

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
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();
  const t = useTranslations();

  const handleClick = onButtonClick || (() => router.push(`/${locale}/register`));

  const finalTitle = title || t('finance.cta.title');
  const finalSubtitle = subtitle || t('finance.cta.subtitle');
  const finalButtonText = buttonText || t('finance.cta.button');

  return (
    <section
      className="py-16 md:py-24 transition-colors"
      style={{ backgroundColor: colors.background.primary }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <Heading level={2} className="mb-4 text-3xl md:text-4xl" style={{ color: colors.text.primary }}>
          {finalTitle}
        </Heading>

        {/* Subtitle */}
        <Text
          variant="body"
          className="mb-8 text-lg"
          style={{ color: colors.text.secondary }}
        >
          {finalSubtitle}
        </Text>

        {/* Button */}
        <Button
          variant="secondary"
          size="lg"
          onClick={handleClick}
          className="font-semibold inline-flex items-center justify-center gap-2"
        >
          {finalButtonText} <FiArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </section>
  );
};
