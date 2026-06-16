'use client';

import React, { useState, useRef } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api';
import { MdClose, MdCloudUpload, MdFileDownload, MdCheckCircle, MdError, MdRefresh } from 'react-icons/md';

interface CsvImportModalProps {
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

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
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

  // CSV Parser supporting quotes and linebreaks
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let entry = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          entry += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(entry.trim());
        entry = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        row.push(entry.trim());
        entry = '';
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
          lines.push(row);
        }
        row = [];
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n
        }
      } else {
        entry += char;
      }
    }
    if (entry || row.length > 0) {
      row.push(entry.trim());
      lines.push(row);
    }
    return lines;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetCSV = (text: string) => {
    setGeneralError(null);
    setImportErrors([]);
    const rows = parseCSV(text);
    if (rows.length < 2) {
      setGeneralError(t('transactions.invalidFile'));
      return;
    }

    // Match headers (case-insensitive)
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const amountIdx = headers.indexOf('amount');
    const typeIdx = headers.indexOf('type');
    const categoryIdx = headers.indexOf('category');
    const dateIdx = headers.indexOf('date');
    const descIdx = headers.indexOf('description');

    if (amountIdx === -1 || typeIdx === -1 || categoryIdx === -1 || dateIdx === -1) {
      setGeneralError('CSV must contain headers: Amount, Type, Category, Date (Description is optional)');
      return;
    }

    const dataRows = rows.slice(1);
    const validated: ParsedTransaction[] = dataRows.map((row, index) => {
      const rowNum = index + 2; // 1-based index + header offset

      const rawAmount = row[amountIdx] || '';
      const rawType = (row[typeIdx] || '').toUpperCase().trim();
      const rawCategory = (row[categoryIdx] || '').toUpperCase().trim();
      const rawDate = row[dateIdx] || '';
      const rawDesc = descIdx !== -1 ? row[descIdx] || '' : '';

      // Validate Amount
      const amount = Number(rawAmount.replace(/,/g, ''));
      if (isNaN(amount) || amount <= 0) {
        return { rowNum, amount: 0, type: 'EXPENSE', category: rawCategory, date: rawDate, description: rawDesc, isValid: false, error: 'Amount must be a number greater than 0' };
      }

      // Validate Type
      if (rawType !== 'INCOME' && rawType !== 'EXPENSE') {
        return { rowNum, amount, type: 'EXPENSE', category: rawCategory, date: rawDate, description: rawDesc, isValid: false, error: 'Type must be INCOME or EXPENSE' };
      }

      // Validate Category
      const validCategories = ['FOOD', 'TRANSPORTATION', 'CLOTHING', 'UTILITIES', 'ENTERTAINMENT', 'HEALTH', 'EDUCATION', 'SHOPPING', 'OTHER'];
      if (rawType === 'EXPENSE' && !validCategories.includes(rawCategory)) {
        return { rowNum, amount, type: rawType, category: rawCategory, date: rawDate, description: rawDesc, isValid: false, error: `Expense category must be one of: ${validCategories.join(', ')}` };
      }

      // Validate Date format: dd/MM/yyyy HH:mm
      const dateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
      if (!rawDate || !dateRegex.test(rawDate.trim())) {
        return { rowNum, amount, type: rawType, category: rawCategory, date: rawDate, description: rawDesc, isValid: false, error: 'Date must follow format dd/MM/yyyy HH:mm (e.g. 15/03/2024 14:30)' };
      }

      // Description length check
      if (rawDesc.length > 500) {
        return { rowNum, amount, type: rawType, category: rawCategory, date: rawDate, description: rawDesc, isValid: false, error: 'Description must be 500 characters or less' };
      }

      return {
        rowNum,
        amount,
        type: rawType as 'INCOME' | 'EXPENSE',
        category: rawType === 'INCOME' ? 'OTHER' : rawCategory,
        date: rawDate.trim(),
        description: rawDesc,
        isValid: true
      };
    });

    setParsedData(validated);
    setImportStatus('parsed');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            validateAndSetCSV(event.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        setGeneralError(t('transactions.invalidFile'));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validateAndSetCSV(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Amount,Type,Category,Date,Description\n"
      + "50000,EXPENSE,FOOD,16/06/2026 12:30,Lunch with coworkers\n"
      + "15000000,INCOME,OTHER,10/06/2026 09:00,Monthly salary payment\n"
      + "120000,EXPENSE,TRANSPORTATION,15/06/2026 18:45,Taxi ride home\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "smartmoney_transaction_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              {t('transactions.csvModalTitle')}
            </Heading>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-1 rounded-lg transition-colors hover:bg-black/5 disabled:opacity-50"
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
                  <p className="font-semibold" style={{ color: colors.text.primary }}>CSV Format Guidelines</p>
                  <ul className="list-disc pl-5 space-y-1" style={{ color: colors.text.secondary }}>
                    <li>Columns: <strong>Amount</strong>, <strong>Type</strong>, <strong>Category</strong>, <strong>Date</strong>, <strong>Description</strong>.</li>
                    <li><strong>Amount</strong>: Positive numbers only (e.g., 50000).</li>
                    <li><strong>Type</strong>: <code>INCOME</code> or <code>EXPENSE</code>.</li>
                    <li><strong>Category</strong>: Required for expenses. Use: <code>FOOD</code>, <code>TRANSPORTATION</code>, <code>CLOTHING</code>, <code>UTILITIES</code>, <code>ENTERTAINMENT</code>, <code>HEALTH</code>, <code>EDUCATION</code>, <code>SHOPPING</code>, <code>OTHER</code>.</li>
                    <li><strong>Date</strong>: Must be in <code>dd/MM/yyyy HH:mm</code> format (e.g., <code>16/06/2026 14:30</code>).</li>
                    <li><strong>Description</strong>: Optional text describing the transaction (max 500 characters).</li>
                  </ul>

                  {/* CSV Template Preview Table */}
                  <div className="overflow-x-auto my-3 border rounded-lg" style={{ borderColor: colors.border.light }}>
                    <table className="min-w-full text-xs text-left border-collapse">
                      <thead>
                        <tr style={{ backgroundColor: colors.background.primary, borderBottom: `1px solid ${colors.border.light}` }}>
                          <th className="p-2 font-bold" style={{ color: colors.text.primary }}>Amount</th>
                          <th className="p-2 font-bold" style={{ color: colors.text.primary }}>Type</th>
                          <th className="p-2 font-bold" style={{ color: colors.text.primary }}>Category</th>
                          <th className="p-2 font-bold" style={{ color: colors.text.primary }}>Date</th>
                          <th className="p-2 font-bold" style={{ color: colors.text.primary }}>Description</th>
                        </tr>
                      </thead>
                      <tbody style={{ color: colors.text.secondary }}>
                        <tr style={{ borderBottom: `1px solid ${colors.border.light}` }}>
                          <td className="p-2">50000</td>
                          <td className="p-2">EXPENSE</td>
                          <td className="p-2">FOOD</td>
                          <td className="p-2 font-mono">16/06/2026 12:30</td>
                          <td className="p-2 italic">Lunch</td>
                        </tr>
                        <tr>
                          <td className="p-2">15000000</td>
                          <td className="p-2">INCOME</td>
                          <td className="p-2">OTHER</td>
                          <td className="p-2 font-mono">10/06/2026 09:00</td>
                          <td className="p-2 italic">Salary</td>
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
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <MdCloudUpload className="w-12 h-12 mb-3" style={{ color: colors.interactive.primary }} />
                  <Text className="font-medium mb-1" style={{ color: colors.text.primary }}>
                    {t('transactions.dropCsvHere')}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                    Only .csv files are supported
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
                    Note: Transactions with validation errors will be skipped. Please fix them in your CSV if they are important.
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
                  Import {parsedData.filter(r => r.isValid).length} Rows
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
