'use client';

import { MainLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';

export default function About() {
  return (
    <MainLayout title="Next.js Frontend">
      <div className="space-y-8 max-w-2xl">
        <section>
          <Heading level={1} className="mb-4">
            About Us
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
              <strong>Molecules:</strong> Simple component combinations like search bars and forms
            </li>
            <li className="list-disc list-inside">
              <strong>Organisms:</strong> Complex components that combine molecules
            </li>
            <li className="list-disc list-inside">
              <strong>Templates:</strong> Page-level layout components
            </li>
          </ul>
        </section>

        <section>
          <Heading level={2} className="mb-4">
            Technologies
          </Heading>
          <ul className="space-y-2">
            <li>Next.js 16 for server-side rendering</li>
            <li>React with TypeScript for type safety</li>
            <li>Tailwind CSS 4 for styling</li>
            <li>Atomic Design for component organization</li>
          </ul>
        </section>

        <section>
          <Heading level={2} className="mb-4">
            Backend Integration
          </Heading>
          <Text>
            This application is configured to connect to a backend API at http://localhost:8081. The API client is set up to handle all HTTP requests with proper error handling and logging.
          </Text>
        </section>
      </div>
    </MainLayout>
  );
}
