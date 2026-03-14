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
            This is a modern Next.js application built with Atomic Design principles, featuring a well-structured component hierarchy and clean code organization.
          </Text>
        </section>

        <section>
          <Heading level={2} className="mb-4">
            Architecture
          </Heading>
          <Text className="mb-4">
            Our application follows the Atomic Design methodology, which organizes components into five levels:
          </Text>
          <ul className="space-y-3 ml-4">
            <li className="list-disc list-inside">
              <strong>Atoms:</strong> Basic building blocks like buttons, inputs, and text
            </li>
            <li className="list-disc list-inside">
              <strong>Molecules:</strong> Simple component combinations
            </li>
            <li className="list-disc list-inside">
              <strong>Organisms:</strong> Complex component combinations
            </li>
            <li className="list-disc list-inside">
              <strong>Templates:</strong> Page-level layouts
            </li>
            <li className="list-disc list-inside">
              <strong>Pages:</strong> Full-featured views
            </li>
          </ul>
        </section>
      </div>
    </MainLayout>
  );
}
