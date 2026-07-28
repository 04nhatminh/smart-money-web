'use client';

import React, { useState } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { useTransactions, type TransactionFilters } from '@/hooks/useTransactions';
import { MdClose, MdFileDownload, MdRefresh } from 'react-icons/md';
import * as XLSX from 'xlsx-js-style';

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

  const toTitleCase = (str: string): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDescription = (desc: string): string => {
    if (!desc) return '';
    const trimmed = desc.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const formatDateStr = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/;
      if (regex.test(dateString)) return dateString;

      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    } catch {
      // Fallback
    }
    return dateString;
  };

  // Convert array of transactions to Excel file and trigger download
  const downloadExcel = (data: any[], filename: string) => {
    const headers = ['No.', 'Amount (VND)', 'Type', 'Category', 'Date', 'Description'];
    const rows: (string | number)[][] = [headers];

    data.forEach((item, index) => {
      const rawAmount = item.amount || 0;
      const typeStr = (item.type || 'EXPENSE').toUpperCase();
      const isIncome = typeStr === 'INCOME';

      const amountVal = isIncome ? Math.abs(rawAmount) : -Math.abs(rawAmount);
      const typeVal = toTitleCase(typeStr);
      const categoryVal = toTitleCase(item.category || 'OTHER');
      const dateVal = formatDateStr(item.date || '');
      const descriptionVal = formatDescription(item.description || '');

      rows.push([index + 1, amountVal, typeVal, categoryVal, dateVal, descriptionVal]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Apply custom column widths
    worksheet['!cols'] = [
      { wch: 8 },  // Column A (No.)
      { wch: 22 }, // Column B (Amount (VND))
      { wch: 14 }, // Column C (Type)
      { wch: 20 }, // Column D (Category)
      { wch: 22 }, // Column E (Date)
      { wch: 40 }  // Column F (Description)
    ];

    // Apply custom row heights
    worksheet['!rows'] = [
      { hpt: 20 }, // Header row
      ...data.map(() => ({ hpt: 18 })) // Data rows
    ];

    const borderColor = '9CA3AF'; // Standard solid border color (Gray 400) for clear table outline
    const cellBorder = {
      top: { style: 'thin', color: { rgb: borderColor } },
      bottom: { style: 'thin', color: { rgb: borderColor } },
      left: { style: 'thin', color: { rgb: borderColor } },
      right: { style: 'thin', color: { rgb: borderColor } }
    };
    const headerBorder = {
      top: { style: 'medium', color: { rgb: '4B5563' } },
      bottom: { style: 'medium', color: { rgb: '4B5563' } },
      left: { style: 'thin', color: { rgb: borderColor } },
      right: { style: 'thin', color: { rgb: borderColor } }
    };

    // Apply styles to cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellRef];
        if (!cell) continue;

        if (R === 0) {
          // Header Row Style: Neutral background #E5E7EB, Dark text #111827, centered header
          cell.s = {
            fill: { fgColor: { rgb: 'E5E7EB' } },
            font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '111827' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: headerBorder
          };
        } else {
          // Data Row Style
          const item = data[R - 1];
          const isIncome = item && (item.type || 'EXPENSE').toUpperCase() === 'INCOME';

          // Zebra striping: alternate white (#FFFFFF) and very light gray (#F9FAFB)
          const rowBgColor = R % 2 === 1 ? 'FFFFFF' : 'F9FAFB';

          // Accent colors: Green #16A34A / Red #DC2626 ONLY on Amount and Type
          const accentColor = isIncome ? '16A34A' : 'DC2626';
          const textColor = (C === 1 || C === 2) ? accentColor : '374151';

          const isCentered = C === 0 || C === 2 || C === 4; // No., Type, Date
          const isRight = C === 1;                          // Amount (VND)

          cell.s = {
            fill: { fgColor: { rgb: rowBgColor } },
            font: {
              name: 'Segoe UI',
              sz: 10,
              bold: C === 1,
              color: { rgb: textColor }
            },
            border: cellBorder,
            alignment: {
              vertical: 'center',
              horizontal: isRight ? 'right' : (isCentered ? 'center' : 'left'),
              indent: isCentered ? 0 : 1
            }
          };

          if (C === 1) {
            cell.z = '+#,##0_ ;-#,##0_ ;0_ ';
          }
        }
      }
    }

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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
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
