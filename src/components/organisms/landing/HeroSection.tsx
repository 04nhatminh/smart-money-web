'use client';

import React from 'react';
import { Heading, Text, Button } from '@/components/atoms';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  primaryCTA?: string;
  secondaryCTA?: string;
  onPrimaryCTA?: () => void;
  onSecondaryCTA?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  onPrimaryCTA,
  onSecondaryCTA,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const finalTitle = title || t('finance.hero.title');
  const finalSubtitle = subtitle || t('finance.hero.subtitle');
  const finalPrimaryCTA = primaryCTA || t('finance.hero.cta');
  const finalSecondaryCTA = secondaryCTA || t('finance.hero.login');

  return (
    <section className="py-16 md:py-24 transition-colors" style={{ backgroundColor: colors.background.primary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Title */}
          <Heading level={1} className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: colors.interactive.primary }}>
            {finalTitle}
          </Heading>

          {/* Subtitle */}
          <Text variant="body" className="mb-8 text-lg md:text-xl" style={{ color: colors.text.secondary }}>
            {finalSubtitle}
          </Text>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={onPrimaryCTA}
              className="font-semibold"
            >
              {finalPrimaryCTA}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onSecondaryCTA}
              className="font-semibold"
            >
              {finalSecondaryCTA}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
