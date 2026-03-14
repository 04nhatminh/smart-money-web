'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/templates';
import { ItemList } from '@/components/organisms';
import { SearchBar } from '@/components/molecules';
import { Heading } from '@/components/atoms';
import { apiClient } from '@/lib/api-client';

export default function Home() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        await apiClient.get('/health');
        console.log('Backend connection successful');
      } catch (error) {
        console.log('Backend is not available yet');
      } finally {
        setIsLoading(false);
      }
    };

    testBackendConnection();
  }, []);

  const sampleItems = [
    {
      id: '1',
      title: 'Item 1',
      description: 'This is the first item',
      price: 29.99
    },
    {
      id: '2',
      title: 'Item 2',
      description: 'This is the second item',
      price: 39.99
    },
    {
      id: '3',
      title: 'Item 3',
      description: 'This is the third item',
      price: 49.99
    }
  ];

  return (
    <MainLayout title={t('common.home')}>
      <div className="space-y-6">
        <SearchBar placeholder={t('common.search')} />
        {isLoading ? (
          <p className="text-center">{t('common.loading')}</p>
        ) : (
          <ItemList items={sampleItems} />
        )}
      </div>
    </MainLayout>
  );
}
