'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MainLayout } from '@/components/templates';
import { Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpCenterPage() {
  const t = useTranslations();
  const { colors } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: t('helpPage.q1'),
      answer: t('helpPage.a1'),
    },
    {
      question: t('helpPage.q2'),
      answer: t('helpPage.a2'),
    },
    {
      question: t('helpPage.q3'),
      answer: t('helpPage.a3'),
    },
    {
      question: t('helpPage.q4'),
      answer: t('helpPage.a4'),
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <MainLayout title={t('common.helpCenter')}>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <Heading level={1} className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: colors.text.primary }}>
            {t('common.helpCenter')}
          </Heading>
          <Text className="text-lg max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
            {t('helpPage.subtitle')}
          </Text>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className="border rounded-xl overflow-hidden transition-all duration-200"
                style={{ 
                  backgroundColor: colors.background.secondary, 
                  borderColor: colors.border.light 
                }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex justify-between items-center p-5 text-left font-semibold focus:outline-none hover:opacity-90"
                  style={{ color: colors.text.primary }}
                >
                  <span>{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="p-5 border-t" style={{ borderTopColor: colors.border.light }}>
                    <Text style={{ color: colors.text.secondary }} className="leading-relaxed">
                      {faq.answer}
                    </Text>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
