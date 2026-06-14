'use client';

import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';

export default function About() {
  const t = useTranslations();

  return (
    <MainLayout title={t('common.about')}>
      <div className="space-y-8 max-w-2xl">
        <section>
          <Heading level={1} className="mb-4">
            {t('common.about')}
          </Heading>
          <Text className="text-gray-600 text-lg">
            {t('aboutPage.subtitle')}
          </Text>
        </section>

        <section>
          <Heading level={2} className="mb-4">
            {t('aboutPage.architecture')}
          </Heading>
          <Text className="mb-4">
            {t('aboutPage.description')}
          </Text>
          <ul className="space-y-3 ml-4">
            <li className="list-disc list-inside">
              {t('aboutPage.atoms')}
            </li>
            <li className="list-disc list-inside">
              {t('aboutPage.molecules')}
            </li>
            <li className="list-disc list-inside">
              {t('aboutPage.organisms')}
            </li>
            <li className="list-disc list-inside">
              {t('aboutPage.templates')}
            </li>
            <li className="list-disc list-inside">
              {t('aboutPage.pages')}
            </li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
}
