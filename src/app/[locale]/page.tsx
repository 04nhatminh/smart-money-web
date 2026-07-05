'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Header, Footer, HeroSection, DashboardPreview, FeaturesSection, BenefitsSection, CTASection } from '@/components/organisms';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { useTheme } from '@/context';

export default function Home() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const { token, isInitializing } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isInitializing && token) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [isInitializing, locale, router, token]);

  if (isInitializing || token) {
    return null;
  }

  return (
    <>
      <Header appName={t('finance.appName')} />
      
      <main style={{ backgroundColor: colors.background.primary }}>
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
