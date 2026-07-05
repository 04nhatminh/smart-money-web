'use client';

import React from 'react';
import { Heading, Text, ScrollReveal } from '@/components/atoms';
import { FeatureCard } from '@/components/molecules';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { FaChartBar, FaBullseye, FaMagic } from 'react-icons/fa';

interface Feature {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface FeaturesProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
}

export const FeaturesSection: React.FC<FeaturesProps> = ({
  title,
  subtitle,
  features,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const finalTitle = title || t('finance.features.title');
  const finalSubtitle = subtitle || t('finance.features.subtitle');

  const defaultFeatures: Feature[] = features || [
    {
      title: t('finance.features.tracking.title'),
      description: t('finance.features.tracking.description'),
      icon: <FaChartBar className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.goals.title'),
      description: t('finance.features.goals.description'),
      icon: <FaBullseye className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.recommendations.title'),
      description: t('finance.features.recommendations.description'),
      icon: <FaMagic className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 transition-colors" style={{ backgroundColor: colors.background.secondary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <ScrollReveal variant="fade-down">
          <div className="text-center mb-16">
            <Heading level={2} className="mb-4">
              {finalTitle}
            </Heading>
            <Text variant="body" className="text-lg" style={{ color: colors.text.secondary }}>
              {finalSubtitle}
            </Text>
          </div>
        </ScrollReveal>

        {/* Features Grid — each card flips in with stagger */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {defaultFeatures.map((feature, index) => (
            <ScrollReveal key={index} variant="flip-x" delay={index * 130}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
