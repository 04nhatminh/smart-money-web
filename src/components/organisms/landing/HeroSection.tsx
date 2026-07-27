'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FiArrowRight } from 'react-icons/fi';
import { Heading, Text, Button, ScrollReveal } from '@/components/atoms';
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
  const router = useRouter();
  const locale = useLocale();
  const { colors, colorScheme } = useTheme();
  const t = useTranslations();

  const handlePrimary = onPrimaryCTA || (() => router.push(`/${locale}/register`));
  const handleSecondary = onSecondaryCTA || (() => router.push(`/${locale}/login`));

  const finalTitle = title || t('finance.hero.title');
  const finalSubtitle = subtitle || t('finance.hero.subtitle');
  const finalPrimaryCTA = primaryCTA || t('finance.hero.cta');
  const finalSecondaryCTA = secondaryCTA || t('finance.hero.login');

  return (
    <section className="py-16 md:py-24 transition-colors" style={{ background: `linear-gradient(135deg, ${colors.background.secondary} 0%, ${colors.background.primary} 100%)` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Title */}
          <ScrollReveal variant="fade-up" delay={0}>
            <Heading level={1} className="mb-6 text-4xl md:text-5xl lg:text-6xl font-bold" style={{ color: colorScheme === 'dark' ? colors.palette.white : colors.interactive.primary }}>
              {finalTitle}
            </Heading>
          </ScrollReveal>

          {/* Subtitle */}
          <ScrollReveal variant="fade-up" delay={120}>
            <Text variant="body" className="mb-8 text-lg md:text-xl" style={{ color: colors.text.secondary }}>
              {finalSubtitle}
            </Text>
          </ScrollReveal>

          {/* CTA Buttons */}
          <ScrollReveal variant="fade-up" delay={240}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handlePrimary}
                className="font-semibold inline-flex items-center justify-center gap-2"
              >
                {finalPrimaryCTA} <FiArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleSecondary}
                className="font-semibold"
              >
                {finalSecondaryCTA}
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
