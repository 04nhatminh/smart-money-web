'use client';

import React from 'react';
import { Button, Text } from '@/components/atoms';

interface FooterProps {
  year?: number;
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  year = new Date().getFullYear(),
  companyName = 'My Company',
}) => {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Text className="text-white font-semibold mb-4">About</Text>
            <Text variant="caption" className="text-gray-400">
              Building amazing products.
            </Text>
          </div>
          <div>
            <Text className="text-white font-semibold mb-4">Links</Text>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <Text className="text-white font-semibold mb-4">Legal</Text>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <Text variant="caption" className="text-gray-400 text-center">
            Copyright {year} {companyName}. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
};
