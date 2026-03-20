'use client';

import { useTranslations } from 'next-intl';
import { Header, Footer, HeroSection, DashboardPreview, FeaturesSection, BenefitsSection, CTASection } from '@/components/organisms';
import { useTheme } from '@/context';
import { PRIMARY_COLORS } from '@/constants/colors';

export default function Home() {
  const t = useTranslations();
  const { colors } = useTheme();

  return (
    <>
      <Header appName={t('finance.appName')} />
      
      <main style={{ backgroundColor: PRIMARY_COLORS.background.primary }}>
        {/* Hero Section */}
        <HeroSection />

        {/* Dashboard Preview */}
        <DashboardPreview />

        {/* Features Section */}
        <FeaturesSection />

        {/* Benefits Section */}
        <BenefitsSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      <Footer appName={t('finance.appName')} />
    </>
  );
}
