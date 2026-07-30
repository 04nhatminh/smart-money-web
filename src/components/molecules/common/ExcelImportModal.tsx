'use client';

import React, { useState, useRef } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import {
  MdClose,
  MdCloudUpload,
  MdFileDownload,
  MdCheckCircle,
  MdError,
  MdRefresh,
  MdOpenInNew,
  MdWarning,
} from 'react-icons/md';
import * as XLSX from 'xlsx-js-style';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedTransaction {
  rowNum: number;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string;
  description: string;
  isValid: boolean;
  error?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, errorCount: 0 });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsed' | 'importing' | 'completed'>('idle');
  const [importErrors, setImportErrors] = useState<{ rowNum: number; error: string }[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setParsedData([]);
      setImportErrors([]);
      setGeneralError(null);
      setImportStatus('idle');
      setProgress({ current: 0, total: 0, success: 0, errorCount: 0 });
      setIsMinimized(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen && !isMinimized) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const parseExcelDate = (val: any): string => {
    if (val instanceof Date) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(val.getDate())}/${pad(val.getMonth() + 1)}/${val.getFullYear()} ${pad(val.getHours())}:${pad(val.getMinutes())}`;
    }
    if (typeof val === 'number') {
      try {
        const dateObj = XLSX.SSF.parse_date_code(val);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(dateObj.d)}/${pad(dateObj.m)}/${dateObj.y} ${pad(dateObj.H)}:${pad(dateObj.M)}`;
      } catch (err) {
        // Fallback if parsing fails
      }
    }
    return String(val || '').trim();
  };

  const validateAndSetExcel = (rows: any[][]) => {
    setGeneralError(null);
    setImportErrors([]);

    if (rows.length < 2) {
      setGeneralError(t('transactions.invalidFile'));
      return;
    }

    // Match headers (case-insensitive)
    const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
    const amountIdx = headers.findIndex(h => h.includes('amount'));
    const typeIdx = headers.findIndex(h => h.includes('type'));
    const categoryIdx = headers.findIndex(h => h.includes('category'));
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const descIdx = headers.findIndex(h => h.includes('description'));

    if (amountIdx === -1 || typeIdx === -1 || categoryIdx === -1 || dateIdx === -1) {
      setGeneralError(t('transactions.excelErrorHeaders'));
      return;
    }

    const dataRows = rows.slice(1);
    const validated: ParsedTransaction[] = [];

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      // Skip completely empty rows
      if (row.length === 0 || row.every(val => val === null || val === undefined || val === '')) {
        continue;
      }

      const rowNum = index + 2; // 1-based index + header offset

      const rawAmount = row[amountIdx];
      const rawType = String(row[typeIdx] || '').toUpperCase().trim();
      const rawCategory = String(row[categoryIdx] || '').toUpperCase().trim();
      const rawDateVal = row[dateIdx];
      const rawDesc = descIdx !== -1 ? String(row[descIdx] || '') : '';

      // Validate Amount
      let amount = 0;
      if (typeof rawAmount === 'number') {
        amount = Math.abs(rawAmount);
      } else {
        const cleaned = String(rawAmount || '').replace(/[^0-9.-]/g, '');
        amount = Math.abs(Number(cleaned));
      }

      if (isNaN(amount) || amount <= 0) {
        validated.push({ rowNum, amount: 0, type: 'EXPENSE', category: rawCategory, date: String(rawDateVal || ''), description: rawDesc, isValid: false, error: t('transactions.excelErrorAmount') });
        continue;
      }

      // Validate Type
      if (rawType !== 'INCOME' && rawType !== 'EXPENSE') {
        validated.push({ rowNum, amount, type: 'EXPENSE', category: rawCategory, date: String(rawDateVal || ''), description: rawDesc, isValid: false, error: t('transactions.excelErrorType') });
        continue;
      }

      // Validate Category
      const validCategories = ['FOOD', 'TRANSPORTATION', 'CLOTHING', 'UTILITIES', 'ENTERTAINMENT', 'HEALTH', 'EDUCATION', 'SHOPPING', 'OTHER'];
      if (rawType === 'EXPENSE' && !validCategories.includes(rawCategory)) {
        validated.push({ rowNum, amount, type: rawType, category: rawCategory, date: String(rawDateVal || ''), description: rawDesc, isValid: false, error: t('transactions.excelErrorCategory', { categories: validCategories.join(', ') }) });
        continue;
      }

      // Parse and Validate Date
      const dateStr = parseExcelDate(rawDateVal);
      const dateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
      if (!dateStr || !dateRegex.test(dateStr.trim())) {
        validated.push({ rowNum, amount, type: rawType, category: rawCategory, date: dateStr, description: rawDesc, isValid: false, error: t('transactions.excelErrorDate') });
        continue;
      }

      // Description length check
      if (rawDesc.length > 500) {
        validated.push({ rowNum, amount, type: rawType, category: rawCategory, date: dateStr, description: rawDesc, isValid: false, error: t('transactions.excelErrorDesc') });
        continue;
      }

      validated.push({
        rowNum,
        amount,
        type: rawType as 'INCOME' | 'EXPENSE',
        category: rawType === 'INCOME' ? 'OTHER' : rawCategory,
        date: dateStr.trim(),
        description: rawDesc,
        isValid: true
      });
    }

    setParsedData(validated);
    setImportStatus('parsed');
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const data = new Uint8Array(event.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          validateAndSetExcel(rows);
        }
      } catch (err) {
        console.error(err);
        setGeneralError(t('transactions.invalidFile'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (isExcel) {
        handleFile(file);
      } else {
        setGeneralError(t('transactions.invalidFile'));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      ['No.', 'Amount (VND)', 'Type', 'Category', 'Date', 'Description'],
      [1, -50000, 'Expense', 'Food', '16/06/2026 12:30', 'Lunch with coworkers'],
      [2, 15000000, 'Income', 'Other', '10/06/2026 09:00', 'Monthly salary payment'],
      [3, -120000, 'Expense', 'Transportation', '15/06/2026 18:45', 'Taxi ride home']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 22 },
      { wch: 14 },
      { wch: 20 },
      { wch: 22 },
      { wch: 40 }
    ];

    worksheet['!rows'] = [
      { hpt: 28 },
      { hpt: 22 },
      { hpt: 22 },
      { hpt: 22 }
    ];

    const borderColor = '9CA3AF';
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

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellRef];
        if (!cell) continue;

        if (R === 0) {
          cell.s = {
            fill: { fgColor: { rgb: 'E5E7EB' } },
            font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '111827' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: headerBorder
          };
        } else {
          const isIncome = R === 2;
          const rowBgColor = R % 2 === 1 ? 'FFFFFF' : 'F9FAFB';
          const accentColor = isIncome ? '16A34A' : 'DC2626';
          const textColor = (C === 1 || C === 2) ? accentColor : '374151';
          const isCentered = C === 0 || C === 2 || C === 4;
          const isRight = C === 1;

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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'smartmoney_transaction_template.xlsx');
  };

  const handleStartImport = async () => {
    if (parsedData.length === 0) return;

    // Track pre-validation failures from file parsing
    const preValidationErrors = parsedData
      .filter(item => !item.isValid)
      .map(item => ({
        rowNum: item.rowNum,
        error: item.error || 'Excel format validation error',
      }));

    const validItems = parsedData.filter(item => item.isValid);

    setIsProcessing(true);
    setImportStatus('importing');
    setImportErrors(preValidationErrors);

    const totalRows = parsedData.length;
    const initialErrorCount = preValidationErrors.length;

    setProgress({
      current: initialErrorCount,
      total: totalRows,
      success: 0,
      errorCount: initialErrorCount,
    });

    const failedImports = [...preValidationErrors];
    let successfulCount = 0;

    // Concurrent Batch Execution (chunk size = 10 for high speed)
    const CONCURRENCY = 10;
    for (let i = 0; i < validItems.length; i += CONCURRENCY) {
      const chunk = validItems.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(async (item) => {
          try {
            await apiClient.post(API_ENDPOINTS.transactions.create, {
              amount: item.amount,
              type: item.type,
              category: item.category,
              description: item.description || undefined,
              date: item.date,
            });
            return { success: true, item };
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'API creation error';
            return { success: false, item, error: errorMsg };
          }
        })
      );

      for (const res of results) {
        if (res.status === 'fulfilled') {
          if (res.value.success) {
            successfulCount++;
          } else {
            failedImports.push({
              rowNum: res.value.item.rowNum,
              error: res.value.error || 'API creation error',
            });
          }
        } else {
          failedImports.push({
            rowNum: 0,
            error: String(res.reason || 'Unknown error'),
          });
        }
      }

      const processedCount = successfulCount + failedImports.length;
      setProgress({
        current: processedCount,
        total: totalRows,
        success: successfulCount,
        errorCount: failedImports.length,
      });
      setImportErrors([...failedImports]);
    }

    setIsProcessing(false);
    setImportStatus('completed');
    if (successfulCount > 0) {
      onSuccess?.();
    }
  };

  const handleReset = () => {
    setParsedData([]);
    setImportErrors([]);
    setGeneralError(null);
    setImportStatus('idle');
    setProgress({ current: 0, total: 0, success: 0, errorCount: 0 });
    setIsMinimized(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseModal = () => {
    if (isProcessing) {
      setIsMinimized(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Floating Minimized Toast / Widget */}
      {isMinimized && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 w-96 space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <MdRefresh className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400" />
              ) : progress.errorCount === 0 ? (
                <MdCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <MdWarning className="w-5 h-5 text-amber-500" />
              )}
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                {isProcessing ? t('transactions.minimizedNotice') : t('transactions.importComplete', { success: progress.success })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title="Expand modal"
              >
                <MdOpenInNew className="w-4 h-4" />
              </button>
              {!isProcessing && (
                <button
                  onClick={() => {
                    setIsMinimized(false);
                    onClose();
                  }}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close"
                >
                  <MdClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-300 bg-indigo-600 dark:bg-indigo-400"
              style={{
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs font-semibold">
            <span className="text-gray-600 dark:text-slate-400">
              {progress.current} / {progress.total}
            </span>
            <div className="flex gap-3">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ {progress.success}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                ✗ {progress.errorCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal overlay */}
      {isOpen && !isMinimized && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 999,
            }}
            onClick={handleCloseModal}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
              style={{ backgroundColor: colors.background.primary }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-6 border-b"
                style={{ borderColor: colors.border.light }}
              >
                <Heading level={3} className="m-0">
                  {t('transactions.excelModalTitle')}
                </Heading>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-lg transition-colors hover:bg-black/5 hover:cursor-pointer"
                  style={{ color: colors.text.secondary }}
                  title={isProcessing ? t('transactions.runInBackground') : 'Close'}
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {importStatus === 'idle' && (
                  <>
                    {/* Guidelines */}
                    <div
                      className="p-4 rounded-lg space-y-2 border text-sm"
                      style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}
                    >
                      <p className="font-semibold" style={{ color: colors.text.primary }}>{t('transactions.excelGuidelineTitle')}</p>
                      <ul className="list-disc pl-5 space-y-1" style={{ color: colors.text.secondary }}>
                        <li><strong>{t('transactions.excelLabelColumns')}</strong>: {t('transactions.excelGuidelineColumnsDesc')}</li>
                        <li><strong>Amount</strong>: {t('transactions.excelGuidelineAmountDesc')}</li>
                        <li><strong>Type</strong>: {t('transactions.excelGuidelineTypeDesc')}</li>
                        <li><strong>Category</strong>: {t('transactions.excelGuidelineCategoryDesc')}</li>
                        <li><strong>Date</strong>: {t('transactions.excelGuidelineDateDesc')}</li>
                        <li><strong>Description</strong>: {t('transactions.excelGuidelineDescDesc')}</li>
                      </ul>

                      {/* Excel Template Preview Table */}
                      <div className="overflow-x-auto my-3 border rounded-lg shadow-sm" style={{ borderColor: '#9CA3AF' }}>
                        <table className="min-w-full text-xs text-left border-collapse" style={{ border: `1px solid #9CA3AF` }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: `1px solid #9CA3AF` }}>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid #9CA3AF`, width: '4%' }}></th>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>A</th>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>B</th>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>C</th>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>D</th>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>E</th>
                              <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary }}>F</th>
                            </tr>
                            <tr style={{ backgroundColor: '#E5E7EB', borderBottom: `2px solid #4B5563` }}>
                              <td className="p-2 text-center font-bold text-[10px]" style={{ backgroundColor: '#F9FAFB', color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>1</td>
                              <th className="p-2 px-2 font-bold text-center" style={{ color: '#111827', borderRight: `1px solid #9CA3AF` }}>No.</th>
                              <th className="p-2 px-3 font-bold text-center" style={{ color: '#111827', borderRight: `1px solid #9CA3AF` }}>{t('transactions.excelHeaderAmount')}</th>
                              <th className="p-2 px-3 font-bold text-center" style={{ color: '#111827', borderRight: `1px solid #9CA3AF` }}>{t('transactions.excelHeaderType')}</th>
                              <th className="p-2 px-3 font-bold text-center" style={{ color: '#111827', borderRight: `1px solid #9CA3AF` }}>{t('transactions.excelHeaderCategory')}</th>
                              <th className="p-2 px-3 font-bold text-center" style={{ color: '#111827', borderRight: `1px solid #9CA3AF` }}>{t('transactions.excelHeaderDate')}</th>
                              <th className="p-2 px-3 font-bold text-center" style={{ color: '#111827' }}>{t('transactions.excelHeaderDescription')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ backgroundColor: '#FFFFFF', borderBottom: `1px solid #9CA3AF` }}>
                              <td className="p-2 text-center font-semibold text-[10px]" style={{ backgroundColor: '#F9FAFB', color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>2</td>
                              <td className="p-2 text-center font-medium" style={{ color: '#374151', borderRight: `1px solid #9CA3AF` }}>1</td>
                              <td className="p-2 pr-3 text-right font-bold" style={{ color: '#DC2626', borderRight: `1px solid #9CA3AF` }}>-50,000</td>
                              <td className="p-2 text-center font-semibold" style={{ color: '#DC2626', borderRight: `1px solid #9CA3AF` }}>Expense</td>
                              <td className="p-2 pl-3 text-left" style={{ color: '#374151', borderRight: `1px solid #9CA3AF` }}>Food</td>
                              <td className="p-2 text-center font-mono" style={{ color: '#374151', borderRight: `1px solid #9CA3AF` }}>16/06/2026 12:30</td>
                              <td className="p-2 pl-3 text-left" style={{ color: '#374151' }}>Lunch with coworkers</td>
                            </tr>
                            <tr style={{ backgroundColor: '#F9FAFB' }}>
                              <td className="p-2 text-center font-semibold text-[10px]" style={{ backgroundColor: '#F9FAFB', color: colors.text.tertiary, borderRight: `1px solid #9CA3AF` }}>3</td>
                              <td className="p-2 text-center font-medium" style={{ color: '#374151', borderRight: `1px solid #9CA3AF` }}>2</td>
                              <td className="p-2 pr-3 text-right font-bold" style={{ color: '#16A34A', borderRight: `1px solid #9CA3AF` }}>+15,000,000</td>
                              <td className="p-2 text-center font-semibold" style={{ color: '#16A34A', borderRight: `1px solid #9CA3AF` }}>Income</td>
                              <td className="p-2 pl-3 text-left" style={{ color: '#374151', borderRight: `1px solid #9CA3AF` }}>Other</td>
                              <td className="p-2 text-center font-mono" style={{ color: '#374151', borderRight: `1px solid #9CA3AF` }}>10/06/2026 09:00</td>
                              <td className="p-2 pl-3 text-left" style={{ color: '#374151' }}>Monthly salary payment</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={handleDownloadTemplate}
                        >
                          <MdFileDownload className="w-4 h-4" />
                          {t('transactions.downloadTemplate')}
                        </Button>
                      </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'hover:bg-black/5'
                      }`}
                      style={{
                        borderColor: dragActive ? colors.interactive.primary : colors.border.light,
                      }}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <MdCloudUpload className="w-12 h-12 mb-3" style={{ color: colors.interactive.primary }} />
                      <Text className="font-medium mb-1" style={{ color: colors.text.primary }}>
                        {t('transactions.dropExcelHere')}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                        {t('transactions.excelOnlySupported')}
                      </Text>
                    </div>

                    {generalError && (
                      <div
                        className="p-4 rounded-lg flex items-start gap-3"
                        style={{ backgroundColor: `${colors.interactive.danger}15`, color: colors.interactive.danger }}
                      >
                        <MdError className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <Text className="font-medium text-sm">{generalError}</Text>
                      </div>
                    )}
                  </>
                )}

                {/* Preview & Validate state */}
                {importStatus === 'parsed' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Text className="font-semibold" style={{ color: colors.text.primary }}>
                        {t('transactions.parseSuccess', { count: parsedData.length })}
                      </Text>
                      <Button variant="secondary" size="sm" onClick={handleReset}>
                        {t('common.cancel')}
                      </Button>
                    </div>

                    {/* Parsed Rows Preview */}
                    <div className="border rounded-lg max-h-60 overflow-y-auto divide-y" style={{ borderColor: colors.border.light }}>
                      {parsedData.map((row) => (
                        <div key={row.rowNum} className="p-3 text-sm flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: row.type === 'INCOME' ? '#D1FAE5' : '#FEE2E2',
                                  color: row.type === 'INCOME' ? '#065F46' : '#991B1B',
                                }}
                              >
                                {row.type}
                              </span>
                              <span className="font-medium" style={{ color: colors.text.primary }}>
                                {row.amount.toLocaleString()} VND
                              </span>
                              <span style={{ color: colors.text.tertiary }}>•</span>
                              <span className="text-xs" style={{ color: colors.text.secondary }}>
                                {row.category}
                              </span>
                            </div>
                            {row.description && (
                              <p className="text-xs italic" style={{ color: colors.text.secondary }}>
                                "{row.description}"
                              </p>
                            )}
                            <p className="text-xs font-mono" style={{ color: colors.text.tertiary }}>
                              {row.date} ({t('transactions.excelRowHeader')} {row.rowNum})
                            </p>
                          </div>

                          <div>
                            {row.isValid ? (
                              <MdCheckCircle className="w-5 h-5" style={{ color: colors.interactive.success }} />
                            ) : (
                              <div className="flex flex-col items-end">
                                <MdError className="w-5 h-5" style={{ color: colors.interactive.danger }} />
                                <span className="text-[10px] text-right mt-1 max-w-[200px]" style={{ color: colors.interactive.danger }}>
                                  {row.error}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {parsedData.some(r => !r.isValid) && (
                      <div
                        className="p-3 rounded-lg border text-xs"
                        style={{ backgroundColor: `${colors.interactive.warning}10`, borderColor: colors.interactive.warning, color: colors.text.primary }}
                      >
                        {t('transactions.excelValidationWarning')}
                      </div>
                    )}
                  </div>
                )}

                {/* Importing processing state */}
                {importStatus === 'importing' && (
                  <div className="py-6 space-y-6 text-center">
                    <div className="flex justify-center">
                      <MdRefresh className="w-12 h-12 animate-spin" style={{ color: colors.interactive.primary }} />
                    </div>
                    <Heading level={4} className="pb-1">
                      {t('transactions.importProgress', { current: progress.current, total: progress.total })}
                    </Heading>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 max-w-md mx-auto overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                          backgroundColor: colors.interactive.primary,
                        }}
                      />
                    </div>

                    {/* Stat Badges Grid */}
                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                      <div className="p-3 rounded-xl border text-center bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-0.5">
                          {t('transactions.excelTotalCount', { count: '' }).replace(': ', '').replace(':', '')}
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {progress.total}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border text-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                          {t('transactions.excelSuccessCount', { count: '' }).replace(': ', '').replace(':', '')}
                        </span>
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                          {progress.success}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border text-center bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50">
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-0.5">
                          {t('transactions.excelFailedCount', { count: '' }).replace(': ', '').replace(':', '')}
                        </span>
                        <span className="text-xl font-bold text-rose-700 dark:text-rose-400">
                          {progress.errorCount}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed status */}
                {importStatus === 'completed' && (
                  <div className="space-y-5">
                    <div className="text-center py-4 space-y-2">
                      <div className="flex justify-center">
                        {progress.errorCount === 0 ? (
                          <MdCheckCircle className="w-14 h-14" style={{ color: colors.interactive.success }} />
                        ) : (
                          <MdWarning className="w-14 h-14 text-amber-500" />
                        )}
                      </div>
                      <Heading level={4} style={{ color: colors.text.primary }}>
                        {progress.errorCount === 0
                          ? t('transactions.importComplete', { success: progress.success })
                          : t('transactions.importCompleteWithErrors', { success: progress.success, failed: progress.errorCount })}
                      </Heading>
                    </div>

                    {/* Stat Badges Grid */}
                    <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                      <div className="p-3 rounded-xl border text-center bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700">
                        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 block mb-0.5">
                          {t('transactions.excelTotalCount', { count: '' }).replace(': ', '').replace(':', '')}
                        </span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {progress.total}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border text-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                          {t('transactions.excelSuccessCount', { count: '' }).replace(': ', '').replace(':', '')}
                        </span>
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                          {progress.success}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl border text-center bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50">
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-0.5">
                          {t('transactions.excelFailedCount', { count: '' }).replace(': ', '').replace(':', '')}
                        </span>
                        <span className="text-xl font-bold text-rose-700 dark:text-rose-400">
                          {progress.errorCount}
                        </span>
                      </div>
                    </div>

                    {/* Failure details section */}
                    {importErrors.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <Text className="font-semibold text-sm" style={{ color: colors.text.primary }}>
                          {t('transactions.failedRowsDetails', { count: importErrors.length })}
                        </Text>
                        <div className="border rounded-xl max-h-52 overflow-y-auto divide-y text-xs shadow-inner" style={{ borderColor: colors.border.light }}>
                          <div className="sticky top-0 bg-gray-100 dark:bg-slate-800 p-2.5 font-bold flex justify-between gap-4 text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">
                            <span className="w-16 flex-shrink-0">{t('transactions.excelRowHeader')}</span>
                            <span className="flex-1">{t('transactions.excelErrorHeader')}</span>
                          </div>
                          {importErrors.map((err, idx) => (
                            <div key={idx} className="p-2.5 flex justify-between gap-4 items-start hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                              <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded text-center w-16 flex-shrink-0">
                                #{err.rowNum}
                              </span>
                              <span className="flex-1 font-medium text-rose-600 dark:text-rose-300">{err.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                className="p-6 border-t flex justify-end gap-3"
                style={{ borderColor: colors.border.light }}
              >
                {importStatus === 'idle' && (
                  <Button variant="secondary" onClick={onClose} disabled={isProcessing}>
                    {t('common.cancel')}
                  </Button>
                )}

                {importStatus === 'parsed' && (
                  <>
                    <Button variant="secondary" onClick={handleReset} disabled={isProcessing}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleStartImport}
                      disabled={parsedData.length === 0 || isProcessing}
                    >
                      {t('transactions.excelImportRowsBtn', { count: parsedData.length })}
                    </Button>
                  </>
                )}

                {importStatus === 'importing' && (
                  <Button variant="secondary" onClick={() => setIsMinimized(true)}>
                    {t('transactions.runInBackground')}
                  </Button>
                )}

                {importStatus === 'completed' && (
                  <Button variant="primary" onClick={onClose}>
                    {t('common.close')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
