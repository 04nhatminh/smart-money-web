'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Heading, Text, Button, ScrollReveal } from '@/components/atoms';
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
      style={{ background: `linear-gradient(135deg, ${colors.palette.base} 0%, ${colors.palette[700]} 100%)` }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <ScrollReveal variant="fade-up" delay={0}>
          <Heading level={2} style={{ color: colors.palette.white }}>
            {finalTitle}
          </Heading>
        </ScrollReveal>

        {/* Subtitle */}
        <ScrollReveal variant="fade-up" delay={120}>
          <Text
            variant="body"
            className="mb-8 text-lg"
            style={{ color: colors.palette[150] }}
          >
            {finalSubtitle}
          </Text>
        </ScrollReveal>

        {/* Button */}
        <ScrollReveal variant="zoom-in" delay={250}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleClick}
            className="font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: colors.palette.white,
              color: colors.palette.base,
            }}
          >
            {finalButtonText} <FiArrowRight className="w-5 h-5" />
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
};
