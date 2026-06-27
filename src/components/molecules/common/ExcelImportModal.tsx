'use client';

import React, { useState, useRef } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { MdClose, MdCloudUpload, MdFileDownload, MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';
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

  React.useEffect(() => {
    if (isOpen) {
      setParsedData([]);
      setImportErrors([]);
      setGeneralError(null);
      setImportStatus('idle');
      setProgress({ current: 0, total: 0, success: 0, errorCount: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
    const amountIdx = headers.indexOf('amount');
    const typeIdx = headers.indexOf('type');
    const categoryIdx = headers.indexOf('category');
    const dateIdx = headers.indexOf('date');
    const descIdx = headers.indexOf('description');

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
        amount = rawAmount;
      } else {
        amount = Number(String(rawAmount || '').replace(/,/g, ''));
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
      ['Amount', 'Type', 'Category', 'Date', 'Description'],
      [50000, 'EXPENSE', 'FOOD', '16/06/2026 12:30', 'Lunch with coworkers'],
      [15000000, 'INCOME', 'OTHER', '10/06/2026 09:00', 'Monthly salary payment'],
      [120000, 'EXPENSE', 'TRANSPORTATION', '15/06/2026 18:45', 'Taxi ride home']
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Apply custom column widths
    worksheet['!cols'] = [
      { wch: 18 }, // Column A (Amount)
      { wch: 12 }, // Column B (Type)
      { wch: 18 }, // Column C (Category)
      { wch: 20 }, // Column D (Date)
      { wch: 35 }  // Column E (Description)
    ];

    // Apply custom row heights
    worksheet['!rows'] = [
      { hpt: 26 }, // Header row
      { hpt: 20 }, // Data row 1
      { hpt: 20 }, // Data row 2
      { hpt: 20 }  // Data row 3
    ];

    // Apply styles to cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellRef];
        if (!cell) continue;

        const topStyle = R === range.s.r ? 'medium' : 'thin';
        const bottomStyle = R === range.e.r ? 'medium' : 'thin';
        const leftStyle = C === range.s.c ? 'medium' : 'thin';
        const rightStyle = C === range.e.c ? 'medium' : 'thin';
        const borderColor = colors.border.dark;

        if (R === 0) {
          // Header Row Style
          cell.s = {
            fill: { fgColor: { rgb: '3629B7' } }, // Indigo background
            font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: topStyle, color: { rgb: borderColor } },
              bottom: { style: R === range.e.r ? 'medium' : 'thin', color: { rgb: borderColor } },
              left: { style: leftStyle, color: { rgb: borderColor } },
              right: { style: rightStyle, color: { rgb: borderColor } }
            }
          };
        } else {
          // Data Row Style (Row 1: EXPENSE, Row 2: INCOME, Row 3: EXPENSE)
          const isIncome = R === 2; // Row 2 is INCOME (15,000,000)

          // Soft background and text colors
          const rowBgColor = isIncome ? 'E6F4EA' : 'FCE8E6';
          const rowTextColor = isIncome ? '137333' : 'C5221F';

          cell.s = {
            fill: { fgColor: { rgb: rowBgColor } },
            font: { name: 'Segoe UI', sz: 10, color: { rgb: rowTextColor } },
            border: {
              top: { style: topStyle, color: { rgb: borderColor } },
              bottom: { style: bottomStyle, color: { rgb: borderColor } },
              left: { style: leftStyle, color: { rgb: borderColor } },
              right: { style: rightStyle, color: { rgb: borderColor } }
            },
            alignment: {
              vertical: 'center',
              horizontal: C === 0 ? 'right' : (C === 1 || C === 3 ? 'center' : 'left')
            }
          };

          if (C === 0) {
            cell.z = '#,##0'; // Numeric currency format
          }
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'smartmoney_transaction_template.xlsx');
  };

  const handleStartImport = async () => {
    const validItems = parsedData.filter(item => item.isValid);
    if (validItems.length === 0) return;

    setIsProcessing(true);
    setImportStatus('importing');
    setImportErrors([]);
    setProgress({ current: 0, total: validItems.length, success: 0, errorCount: 0 });

    const failedImports: { rowNum: number; error: string }[] = [];
    let successfulCount = 0;

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      setProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        await apiClient.post(API_ENDPOINTS.transactions.create, {
          amount: item.amount,
          type: item.type,
          category: item.category,
          description: item.description || undefined,
          date: item.date,
        });
        successfulCount++;
        setProgress(prev => ({ ...prev, success: successfulCount }));
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'API creation error';
        failedImports.push({ rowNum: item.rowNum, error: errorMsg });
        setProgress(prev => ({ ...prev, errorCount: failedImports.length }));
      }
    }

    setImportErrors(failedImports);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
        }}
        onClick={isProcessing ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
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
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 rounded-lg transition-colors hover:bg-black/5 disabled:opacity-50 hover:cursor-pointer"
              style={{ color: colors.text.secondary }}
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
                  <div className="overflow-x-auto my-3 border rounded-lg shadow-sm" style={{ borderColor: colors.border.light }}>
                    <table className="min-w-full text-xs text-left border-collapse" style={{ border: `1px solid ${colors.border.light}` }}>
                      <thead>
                        {/* Excel-style Column Indicators A, B, C, D, E */}
                        <tr style={{ backgroundColor: '#F3F4F6', borderBottom: `1px solid ${colors.border.light}` }}>
                          <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}`, width: '5%' }}></th>
                          <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>A</th>
                          <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>B</th>
                          <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>C</th>
                          <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>D</th>
                          <th className="p-1 text-center font-semibold text-[10px]" style={{ color: colors.text.tertiary }}>E</th>
                        </tr>
                        {/* Styled Header Row */}
                        <tr style={{ backgroundColor: '#3629B7', borderBottom: `1px solid #3026A6` }}>
                          <td className="p-2 text-center font-bold text-[10px]" style={{ backgroundColor: '#F3F4F6', color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>1</td>
                          <th className="p-2 font-bold text-center" style={{ color: '#FFFFFF', borderRight: `1px solid #B1ACEC` }}>{t('transactions.excelHeaderAmount')}</th>
                          <th className="p-2 font-bold text-center" style={{ color: '#FFFFFF', borderRight: `1px solid #B1ACEC` }}>{t('transactions.excelHeaderType')}</th>
                          <th className="p-2 font-bold text-center" style={{ color: '#FFFFFF', borderRight: `1px solid #B1ACEC` }}>{t('transactions.excelHeaderCategory')}</th>
                          <th className="p-2 font-bold text-center" style={{ color: '#FFFFFF', borderRight: `1px solid #B1ACEC` }}>{t('transactions.excelHeaderDate')}</th>
                          <th className="p-2 font-bold text-center" style={{ color: '#FFFFFF' }}>{t('transactions.excelHeaderDescription')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Row 2: EXPENSE */}
                        <tr style={{ backgroundColor: '#FCE8E6', borderBottom: `1px solid ${colors.border.light}` }}>
                          <td className="p-2 text-center font-semibold text-[10px]" style={{ backgroundColor: '#F3F4F6', color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>2</td>
                          <td className="p-2 text-right font-medium" style={{ color: '#C5221F', borderRight: `1px solid #C5C1F1` }}>50,000</td>
                          <td className="p-2 text-center font-semibold" style={{ color: '#C5221F', borderRight: `1px solid #C5C1F1` }}>EXPENSE</td>
                          <td className="p-2 text-center" style={{ color: '#C5221F', borderRight: `1px solid #C5C1F1` }}>FOOD</td>
                          <td className="p-2 text-center font-mono" style={{ color: '#C5221F', borderRight: `1px solid #C5C1F1` }}>16/06/2026 12:30</td>
                          <td className="p-2 italic" style={{ color: '#C5221F' }}>Lunch with coworkers</td>
                        </tr>
                        {/* Row 3: INCOME */}
                        <tr style={{ backgroundColor: '#E6F4EA' }}>
                          <td className="p-2 text-center font-semibold text-[10px]" style={{ backgroundColor: '#F3F4F6', color: colors.text.tertiary, borderRight: `1px solid ${colors.border.light}` }}>3</td>
                          <td className="p-2 text-right font-medium" style={{ color: '#137333', borderRight: `1px solid #C5C1F1` }}>15,000,000</td>
                          <td className="p-2 text-center font-semibold" style={{ color: '#137333', borderRight: `1px solid #C5C1F1` }}>INCOME</td>
                          <td className="p-2 text-center" style={{ color: '#137333', borderRight: `1px solid #C5C1F1` }}>OTHER</td>
                          <td className="p-2 text-center font-mono" style={{ color: '#137333', borderRight: `1px solid #C5C1F1` }}>10/06/2026 09:00</td>
                          <td className="p-2 italic" style={{ color: '#137333' }}>Monthly salary payment</td>
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
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50/10' : 'hover:bg-black/5'
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
                          {row.date} (Row {row.rowNum})
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
              <div className="py-8 space-y-4 text-center">
                <div className="flex justify-center">
                  <MdRefresh className="w-12 h-12 animate-spin" style={{ color: colors.interactive.primary }} />
                </div>
                <Heading level={4} style={{ color: colors.text.primary }}>
                  {t('transactions.importProgress', { current: progress.current, total: progress.total })}
                </Heading>
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                      backgroundColor: colors.interactive.primary,
                    }}
                  />
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <span style={{ color: colors.interactive.success }}>Success: {progress.success}</span>
                  <span style={{ color: colors.interactive.danger }}>Failed: {progress.errorCount}</span>
                </div>
              </div>
            )}

            {/* Completed status */}
            {importStatus === 'completed' && (
              <div className="space-y-4">
                <div className="text-center py-6 space-y-2">
                  <div className="flex justify-center">
                    {progress.errorCount === 0 ? (
                      <MdCheckCircle className="w-14 h-14" style={{ color: colors.interactive.success }} />
                    ) : (
                      <MdError className="w-14 h-14" style={{ color: colors.interactive.warning }} />
                    )}
                  </div>
                  <Heading level={4} style={{ color: colors.text.primary }}>
                    {t('transactions.importComplete', { success: progress.success })}
                  </Heading>
                </div>

                {importErrors.length > 0 && (
                  <div className="space-y-2">
                    <Text className="font-semibold text-sm" style={{ color: colors.text.primary }}>
                      {t('transactions.partialErrors')}
                    </Text>
                    <div className="border rounded-lg max-h-48 overflow-y-auto divide-y text-xs" style={{ borderColor: colors.border.light }}>
                      {importErrors.map((err, idx) => (
                        <div key={idx} className="p-2.5 flex justify-between gap-4" style={{ color: colors.interactive.danger }}>
                          <span className="font-medium">Row {err.rowNum}</span>
                          <span>{err.error}</span>
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
                  disabled={parsedData.filter(r => r.isValid).length === 0 || isProcessing}
                >
                  {t('transactions.excelImportRowsBtn', { count: parsedData.filter(r => r.isValid).length })}
                </Button>
              </>
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
  );
};
