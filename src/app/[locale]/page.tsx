'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Header, Footer, ItemList } from '@/components/organisms';
import { Card, SearchBar, Pagination } from '@/components/molecules';
import { Heading, Button, Input, Text } from '@/components/atoms';
import { LIGHT_COLORS } from '@/constants/colors';
import { useTheme } from '@/context';

export default function Home() {
  const t = useTranslations();
  const { colors } = useTheme();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const sampleItems = [
    {
      id: '1',
      title: 'Sample Item 1',
      description: 'This is a sample item from the Atomic Design component',
      onAction: () => console.log('Action 1 clicked'),
    },
    {
      id: '2',
      title: 'Sample Item 2',
      description: 'Another sample item to demonstrate the ItemList organism',
      onAction: () => console.log('Action 2 clicked'),
    },
    {
      id: '3',
      title: 'Sample Item 3',
      description: 'Third sample item showing the grid layout',
      onAction: () => console.log('Action 3 clicked'),
    },
    {
      id: '4',
      title: 'Sample Item 4',
      description: 'Fourth sample item for pagination demo',
      onAction: () => console.log('Action 4 clicked'),
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log(`Searching for: ${query}`);
  };

  const navItems = [
    { label: t('common.home'), href: '#' },
    { label: t('common.about'), href: '/about' },
    { label: t('common.features'), href: '#' },
    { label: t('common.contact'), href: '#' },
  ];

  return (
    <>
      <Header title={t('page.title')} navItems={navItems} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen transition-colors" style={{ backgroundColor: colors.background.primary, color: colors.text.primary }}>
        {/* Title Section */}
        <section className="mb-16">
          <Heading level={1} className="mb-4">
            {t('page.title')}
          </Heading>
          <Text variant="body" className="text-lg">
            {t('page.subtitle')}
          </Text>
        </section>

        {/* Atoms Section */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            {t('page.atoms')}
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Buttons */}
            <Card title={t('page.button')} description={t('page.buttonDesc')}>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="primary" size="sm">{t('page.primarySM')}</Button>
                  <Button variant="primary" size="md">{t('page.primaryMD')}</Button>
                  <Button variant="primary" size="lg">{t('page.primaryLG')}</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="md">{t('page.secondary')}</Button>
                  <Button variant="danger" size="md">{t('page.danger')}</Button>
                  <Button variant="success" size="md">{t('page.success')}</Button>
                </div>
              </div>
            </Card>

            {/* Input */}
            <Card title={t('page.input')} description={t('page.inputDesc')}>
              <div className="space-y-3">
                <Input label={t('common.search')} placeholder={t('common.search')} />
                <Input label={t('common.error')} error={t('validation.required')} placeholder={t('common.cancel')} />
              </div>
            </Card>

            {/* Text Variants */}
            <Card title={t('page.text')} description={t('page.textDesc')}>
              <div className="space-y-2">
                <Text variant="body" weight="bold">{t('common.submit')}</Text>
                <Text variant="body">{t('common.home')}</Text>
                <Text variant="caption">{t('common.info')}</Text>
                <Text variant="small">{t('common.warning')}</Text>
                <Text variant="code">code_example()</Text>
              </div>
            </Card>

            {/* Headings */}
            <Card title={t('page.heading')} description={t('page.headingDesc')}>
              <div className="space-y-2">
                <Heading level={3}>{t('page.heading')} 3</Heading>
                <Heading level={4}>{t('page.heading')} 4</Heading>
                <Heading level={5}>{t('page.heading')} 5</Heading>
                <Heading level={6}>{t('page.heading')} 6</Heading>
              </div>
            </Card>
          </div>
        </section>

        {/* Molecules Section */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            {t('page.molecules')}
          </Heading>
          <div className="space-y-6">
            {/* Cards Grid */}
            <div>
              <Heading level={3} className="mb-4">{t('page.card')}</Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  title="Card 1" 
                  description={t('page.buildingProducts')}
                  onAction={() => alert('Card 1 action clicked')}
                  actionLabel={t('page.learnMore')}
                />
                <Card 
                  title="Card 2" 
                  description={t('page.buildingProducts')}
                  onAction={() => alert('Card 2 action clicked')}
                  actionLabel={t('page.explore')}
                />
                <Card 
                  title="Card 3" 
                  description={t('page.buildingProducts')}
                  onAction={() => alert('Card 3 action clicked')}
                  actionLabel={t('page.view')}
                />
              </div>
            </div>

            {/* SearchBar */}
            <div>
              <Heading level={3} className="mb-4">{t('page.searchBar')}</Heading>
              <SearchBar 
                onSearch={handleSearch} 
                placeholder={t('common.search')}
              />
              {searchQuery && (
                <Text variant="caption" className="mt-2">
                  {t('common.search')}: <strong>{searchQuery}</strong>
                </Text>
              )}
            </div>

            {/* Pagination */}
            <div>
              <Heading level={3} className="mb-4">{t('page.pagination')}</Heading>
              <Pagination 
                currentPage={currentPage} 
                totalPages={5}
                onPageChange={setCurrentPage}
              />
              <Text variant="caption" className="mt-2">
                {t('common.loading')} {currentPage}
              </Text>
            </div>
          </div>
        </section>

        {/* Organisms Section */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            {t('page.organisms')}
          </Heading>
          <div className="space-y-6">
            {/* ItemList */}
            <div>
              <Heading level={3} className="mb-4">{t('page.itemList')}</Heading>
              <ItemList items={sampleItems} title={t('common.search')} />
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            {t('page.colorPalette')}
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.primary }}>
              <Text weight="bold">{t('page.primarySM')}</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.primary.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.secondary }}>
              <Text weight="bold">{t('page.secondary')}</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.secondary.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.danger }}>
              <Text weight="bold">{t('page.danger')}</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.danger.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.success }}>
              <Text weight="bold">{t('page.success')}</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.success.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.warning }}>
              <Text weight="bold">{t('page.warning')}</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.warning.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg border-2 text-center" style={{ borderColor: LIGHT_COLORS.border.light, color: LIGHT_COLORS.text.primary }}>
              <Text weight="bold">{t('common.info')}</Text>
              <Text variant="caption" className="mt-1">#{LIGHT_COLORS.border.light.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.text.primary }}>
              <Text weight="bold">{t('common.search')}</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.text.primary.substring(1)}</Text>
            </div>
          </div>
        </section>
      </main>

      <Footer 
        year={new Date().getFullYear()} 
        companyName="Capstone Project"
      />
    </>
  );
}
