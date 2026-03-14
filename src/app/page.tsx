'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/templates';
import { Header, Footer, ItemList } from '@/components/organisms';
import { Card, SearchBar, Pagination, LoginForm } from '@/components/molecules';
import { Heading, Button, Input, Text } from '@/components/atoms';
import { LIGHT_COLORS } from '@/constants/colors';

export default function Home() {
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
    { label: 'Home', href: '#' },
    { label: 'About', href: '/about' },
    { label: 'Features', href: '#' },
    { label: 'Contact', href: '#' },
  ];

  return (
    <>
      <Header title="Component Showcase" navItems={navItems} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <section className="mb-16">
          <Heading level={1} className="mb-4">
            UI Component Library
          </Heading>
          <Text variant="body" className="text-lg">
            Complete showcase of all available components in the design system
          </Text>
        </section>

        {/* Atoms Section */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            Atoms
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Buttons */}
            <Card title="Button Component" description="Available in multiple variants and sizes">
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button variant="primary" size="sm">Primary SM</Button>
                  <Button variant="primary" size="md">Primary MD</Button>
                  <Button variant="primary" size="lg">Primary LG</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" size="md">Secondary</Button>
                  <Button variant="danger" size="md">Danger</Button>
                  <Button variant="success" size="md">Success</Button>
                  <Button variant="info" size="md">Info</Button>
                </div>
              </div>
            </Card>

            {/* Input */}
            <Card title="Input Component" description="Text input with label and error support">
              <div className="space-y-3">
                <Input label="Standard Input" placeholder="Enter text..." />
                <Input label="With Error" error="This field is required" placeholder="Invalid..." />
              </div>
            </Card>

            {/* Text Variants */}
            <Card title="Text Component" description="Various text styles and weights">
              <div className="space-y-2">
                <Text variant="body" weight="bold">Bold Body Text</Text>
                <Text variant="body">Normal Body Text</Text>
                <Text variant="caption">Caption Text</Text>
                <Text variant="small">Small Text</Text>
                <Text variant="code">code_example()</Text>
              </div>
            </Card>

            {/* Headings */}
            <Card title="Heading Component" description="Different heading levels">
              <div className="space-y-2">
                <Heading level={3}>Heading Level 3</Heading>
                <Heading level={4}>Heading Level 4</Heading>
                <Heading level={5}>Heading Level 5</Heading>
                <Heading level={6}>Heading Level 6</Heading>
              </div>
            </Card>
          </div>
        </section>

        {/* Molecules Section */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            Molecules
          </Heading>
          <div className="space-y-6">
            {/* Cards Grid */}
            <div>
              <Heading level={3} className="mb-4">Card Component</Heading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  title="Card 1" 
                  description="This is a card with an action button"
                  onAction={() => alert('Card 1 action clicked')}
                  actionLabel="Learn More"
                />
                <Card 
                  title="Card 2" 
                  description="Another card to showcase the card component"
                  onAction={() => alert('Card 2 action clicked')}
                  actionLabel="Explore"
                />
                <Card 
                  title="Card 3" 
                  description="Third card in the grid"
                  onAction={() => alert('Card 3 action clicked')}
                  actionLabel="View"
                />
              </div>
            </div>

            {/* SearchBar */}
            <div>
              <Heading level={3} className="mb-4">SearchBar Component</Heading>
              <SearchBar 
                onSearch={handleSearch} 
                placeholder="Search items..." 
              />
              {searchQuery && (
                <Text variant="caption" className="mt-2">
                  Current search: <strong>{searchQuery}</strong>
                </Text>
              )}
            </div>

            {/* Pagination */}
            <div>
              <Heading level={3} className="mb-4">Pagination Component</Heading>
              <Pagination 
                currentPage={currentPage} 
                totalPages={5}
                onPageChange={setCurrentPage}
              />
              <Text variant="caption" className="mt-2">
                You are on page {currentPage}
              </Text>
            </div>
          </div>
        </section>

        {/* Organisms Section */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            Organisms
          </Heading>
          <div className="space-y-6">
            {/* ItemList */}
            <div>
              <Heading level={3} className="mb-4">ItemList Component</Heading>
              <ItemList items={sampleItems} title="Featured Items" />
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <Heading level={2} className="mb-8">
            Design System Colors
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.primary }}>
              <Text weight="bold">Primary</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.primary.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.secondary }}>
              <Text weight="bold">Secondary</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.secondary.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.danger }}>
              <Text weight="bold">Danger</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.danger.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.success }}>
              <Text weight="bold">Success</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.success.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.warning }}>
              <Text weight="bold">Warning</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.warning.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.interactive.info }}>
              <Text weight="bold">Info</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.interactive.info.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg border-2 text-center" style={{ borderColor: LIGHT_COLORS.border.light, color: LIGHT_COLORS.text.primary }}>
              <Text weight="bold">Border Light</Text>
              <Text variant="caption" className="mt-1">#{LIGHT_COLORS.border.light.substring(1)}</Text>
            </div>
            <div className="p-4 rounded-lg text-white text-center" style={{ backgroundColor: LIGHT_COLORS.text.primary }}>
              <Text weight="bold">Text Primary</Text>
              <Text variant="caption" className="mt-1 opacity-80">#{LIGHT_COLORS.text.primary.substring(1)}</Text>
            </div>
          </div>
        </section>
      </main>

      <Footer year={new Date().getFullYear()} companyName="Capstone Project" />
    </>
  );
}
