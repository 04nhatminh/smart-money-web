'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/templates';
import { ItemList } from '@/components/organisms';
import { SearchBar } from '@/components/molecules';
import { Heading } from '@/components/atoms';
import { apiClient } from '@/lib/api-client';

export default function Home() {
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
      title: 'Sample Item 1',
      description: 'This is a sample item from the Atomic Design component',
    },
    {
      id: '2',
      title: 'Sample Item 2',
      description: 'Another sample item to demonstrate the ItemList organism',
    },
    {
      id: '3',
      title: 'Sample Item 3',
      description: 'Third sample item showing the grid layout',
    },
  ];

  const handleSearch = (query: string) => {
    console.log(`Searching for: ${query}`);
  };

  return (
    <MainLayout
      title="Next.js Frontend"
      navItems={[
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
      ]}
    >
      <div className="space-y-8">
        <section>
          <Heading level={1} className="mb-4">
            Welcome to Our Application
          </Heading>
          <p className="text-gray-600 text-lg">
            This is a Next.js frontend built with Atomic Design principles.
          </p>
        </section>

        <section>
          <Heading level={2} className="mb-4">
            Search
          </Heading>
          <SearchBar onSearch={handleSearch} placeholder="Search items..." />
        </section>

        <section>
          <ItemList items={sampleItems} title="Featured Items" />
        </section>
      </div>
    </MainLayout>
  );
}
