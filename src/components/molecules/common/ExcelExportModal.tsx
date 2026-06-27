'use client';

import React, { useState } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { useTransactions, type TransactionFilters } from '@/hooks/useTransactions';
import { MdClose, MdFileDownload, MdRefresh } from 'react-icons/md';
import * as XLSX from 'xlsx';

interface ExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  totalElements: number;
  currentPage: number;
  currentTransactions: any[];
  activeFilters: TransactionFilters;
}

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({
  isOpen,
  onClose,
  totalPages,
  totalElements,
  currentPage,
  currentTransactions,
  activeFilters,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { listTransactions } = useTransactions();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  // Convert array of transactions to Excel file and trigger download
  const downloadExcel = (data: any[], filename: string) => {
    const headers = ['Amount', 'Type', 'Category', 'Date', 'Description'];
    const rows = [headers];

    data.forEach(item => {
      const amount = item.amount || 0;
      const type = item.type || 'EXPENSE';
      const category = item.category || 'OTHER';
      const date = item.date || '';
      const description = item.description || '';

      rows.push([amount, type, category, date, description]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, filename);
  };

  const handleExportCurrent = () => {
    setIsExporting(true);
    try {
      downloadExcel(currentTransactions, `smartmoney_transactions_page_${currentPage}.xlsx`);
      onClose();
    } catch (error) {
      console.error('Failed to export current page:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    setExportProgress(0);
    const allTransactions: any[] = [];

    try {
      // Fetch each page sequentially to preserve server state / filters
      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        setExportProgress(Math.round(((pageIdx) / totalPages) * 100));

        const result = await listTransactions({
          ...activeFilters,
          page: pageIdx,
          size: 10, // match user experience size
        });

        if (result.success && result.data) {
          const items = (result.data as any).items || (result.data as any).transactions || result.data.content || [];
          allTransactions.push(...items);
        }
      }
      setExportProgress(100);
      downloadExcel(allTransactions, 'smartmoney_all_transactions.xlsx');
      onClose();
    } catch (error) {
      console.error('Failed to export all pages:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const showTwoOptions = totalPages > 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
        }}
        onClick={isExporting ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
          style={{ backgroundColor: colors.background.primary }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: colors.border.light }}
          >
            <Heading level={3} className="m-0">
              {t('transactions.exportModalTitle')}
            </Heading>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-1 rounded-lg transition-colors hover:bg-black/5 disabled:opacity-50 hover:cursor-pointer"
              style={{ color: colors.text.secondary }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {isExporting ? (
              <div className="py-6 text-center space-y-3">
                <div className="flex justify-center">
                  <MdRefresh className="w-10 h-10 animate-spin" style={{ color: colors.interactive.primary }} />
                </div>
                <Text className="font-medium" style={{ color: colors.text.primary }}>
                  {t('transactions.exportProgress')}
                </Text>
                {totalPages > 1 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[240px] mx-auto overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${exportProgress}%`,
                        backgroundColor: colors.interactive.primary,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Text style={{ color: colors.text.secondary }} className="text-sm">
                  {t('transactions.chooseExportOption')}
                </Text>

                <div className="space-y-3">
                  {/* Option: Current Page */}
                  <button
                    onClick={handleExportCurrent}
                    className="w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between hover:opacity-80 hover:cursor-pointer"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.surface.secondary,
                    }}
                  >
                    <div>
                      <p className="font-semibold text-sm" style={{ color: colors.text.primary }}>
                        {t('transactions.exportOptionCurrent', { count: currentTransactions.length })}
                      </p>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        {t('transactions.exportCurrentDesc', { page: currentPage })}
                      </p>
                    </div>
                    <MdFileDownload className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                  </button>

                  {/* Option: All Pages */}
                  {showTwoOptions && (
                    <button
                      onClick={handleExportAll}
                      className="w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between hover:opacity-80 hover:cursor-pointer"
                      style={{
                        borderColor: colors.border.light,
                        backgroundColor: colors.surface.secondary,
                      }}
                    >
                      <div>
                        <p className="font-semibold text-sm" style={{ color: colors.text.primary }}>
                          {t('transactions.exportOptionAll', { count: totalElements })}
                        </p>
                        <p className="text-xs" style={{ color: colors.text.secondary }}>
                          {t('transactions.exportAllDesc', { pages: totalPages })}
                        </p>
                      </div>
                      <MdFileDownload className="w-5 h-5" style={{ color: colors.interactive.primary }} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="p-6 border-t flex justify-end gap-3"
            style={{ borderColor: colors.border.light }}
          >
            <Button variant="secondary" onClick={onClose} disabled={isExporting}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
