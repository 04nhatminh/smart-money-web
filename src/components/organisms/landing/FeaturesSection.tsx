'use client';

import React from 'react';
import { Heading, Text, ScrollReveal } from '@/components/atoms';
import { FeatureCard } from '@/components/molecules';
import { useTheme } from '@/context';
import { useTranslations } from 'next-intl';
import { FaBrain, FaMicrophone, FaChartLine, FaUsers, FaSlidersH, FaChartBar } from 'react-icons/fa';

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
      title: t('finance.features.budgetEngine.title'),
      description: t('finance.features.budgetEngine.description'),
      icon: <FaBrain className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.multiInput.title'),
      description: t('finance.features.multiInput.description'),
      icon: <FaMicrophone className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.smartInsights.title'),
      description: t('finance.features.smartInsights.description'),
      icon: <FaChartLine className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.savingGoals.title'),
      description: t('finance.features.savingGoals.description'),
      icon: <FaUsers className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.financialProfile.title'),
      description: t('finance.features.financialProfile.description'),
      icon: <FaSlidersH className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
    {
      title: t('finance.features.deepAnalytics.title'),
      description: t('finance.features.deepAnalytics.description'),
      icon: <FaChartBar className="text-3xl" style={{ color: colors.interactive.primary }} />,
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 transition-colors relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.secondary} 50%, ${colors.background.primary} 100%)` }}>
      {/* Ambient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute w-[350px] md:w-[550px] h-[350px] md:h-[550px] rounded-full filter blur-[90px] md:blur-[130px] opacity-[0.16] dark:opacity-[0.24] animate-blob-2" 
          style={{ 
            backgroundColor: colors.interactive.secondary,
            top: '10%',
            left: '-8%',
          }} 
        />
        <div 
          className="absolute w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full filter blur-[80px] md:blur-[120px] opacity-[0.14] dark:opacity-[0.20] animate-blob-1" 
          style={{ 
            backgroundColor: colors.interactive.primary,
            bottom: '10%',
            right: '-5%',
          }} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
