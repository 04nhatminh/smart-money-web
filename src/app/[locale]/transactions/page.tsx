'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, StatCard, TransactionRow, CreateTransactionModal, EditTransactionModal, TransactionMethodModal, ImageBillUploadModal, VoiceRecordModal, TransactionFilter, Pagination, ExcelImportModal, ExcelExportModal, type TransactionFilterState } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions, type TransactionFilters } from '@/hooks/useTransactions';
import { transformAIResultToFormData } from '@/lib/ai-result-transformer';
import { MdAdd, MdFileDownload, MdCalendarToday, MdArrowDownward, MdArrowUpward, MdExpandMore, MdAttachMoney, MdCategory, MdOutlineSwapHoriz, MdShortText, MdCheck } from 'react-icons/md';
import { MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown, MdRefresh, MdSort } from 'react-icons/md';
import { formatVietnamsePrice } from '@/lib/format';

interface Transaction {
  id: string;
  userId?: string;
  title?: string;
  category: string;
  date: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TransactionsPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const locale = useLocale();
  const t = useTranslations();
  const { colors } = useTheme();
  const { isLoading, listTransactions, deleteTransaction } = useTransactions();
  // Parse initial filters from URL search params
  const [filterState, setFilterState] = useState<TransactionFilterState>(() => {
    const filters: TransactionFilterState = {};
    const category = searchParams.get('category');
    const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null;
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    if (category) filters.category = category;
    if (type === 'INCOME' || type === 'EXPENSE') filters.type = type;
    if (minAmount) filters.minAmount = Number(minAmount);
    if (maxAmount) filters.maxAmount = Number(maxAmount);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;

    return filters;
  });

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category' | 'type' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isExcelExportOpen, setIsExcelExportOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [aiFormData, setAiFormData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Check authentication
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Sync filterState change back to browser URL
  useEffect(() => {
    if (!isAuthenticated) return;

    const params = new URLSearchParams();
    if (filterState.category) params.set('category', filterState.category);
    if (filterState.type) params.set('type', filterState.type);
    if (filterState.minAmount) params.set('minAmount', filterState.minAmount.toString());
    if (filterState.maxAmount) params.set('maxAmount', filterState.maxAmount.toString());
    if (filterState.startDate) params.set('startDate', filterState.startDate);
    if (filterState.endDate) params.set('endDate', filterState.endDate);
    if (filterState.search) params.set('search', filterState.search);

    const newQueryStr = params.toString();
    const currentQueryStr = window.location.search.replace(/^\?/, '');

    if (newQueryStr !== currentQueryStr) {
      const newPath = `/${locale}/transactions${newQueryStr ? `?${newQueryStr}` : ''}`;
      router.replace(newPath, { scroll: false });
    }
  }, [filterState, locale, router, isAuthenticated]);

  // Sync external search params changes (e.g. backward/forward navigation or initial searchParams resolving) to filterState
  useEffect(() => {
    const category = searchParams.get('category') || undefined;
    const type = (searchParams.get('type') as 'INCOME' | 'EXPENSE') || undefined;
    const minAmount = searchParams.get('minAmount') ? Number(searchParams.get('minAmount')) : undefined;
    const maxAmount = searchParams.get('maxAmount') ? Number(searchParams.get('maxAmount')) : undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;

    setFilterState({
      category,
      type,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      search,
    });
  }, [searchParams]);

  // Load transactions after auth is initialized or filter/sort changes
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1); // Reset to first page when filters change
      loadTransactions(1);
    }
  }, [isAuthenticated, filterState, sortBy, sortOrder]);

  const loadTransactions = async (page: number = currentPage) => {
    const apiFilters: TransactionFilters = {
      page: page - 1, // API uses 0-indexed pages
      size: ITEMS_PER_PAGE,
      sortBy,
      sortOrder,
      ...filterState,
    };
    
    const result = await listTransactions(apiFilters);
    if (result.success && result.data) {
      setTransactions((result.data as any).items || (result.data as any).transactions || result.data.content || []);
      setTotalPages((result.data as any).totalPages || 1);
      setTotalElements((result.data as any).totalElements || 0);
      setTotalIncome(result.data.totalIncome || 0);
      setTotalExpenses(result.data.totalExpenses || 0);
      setTotalBalance(result.data.totalBalance || 0);
    } else {
      setTransactions([]);
      setTotalPages(1);
      setTotalElements(0);
      setTotalIncome(0);
      setTotalExpenses(0);
      setTotalBalance(0);
    }
  };

  const handleEditClick = (id: string) => {
    setEditingTransactionId(id);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm(t('transactions.deleteConfirm'))) {
      return;
    }

    try {
      setDeleteLoading(true);
      const result = await deleteTransaction(id);
      if (result.success) {
        setTransactions(transactions.filter(t => t.id !== id));
      } else {
        alert(t('transactions.deleteFailed') + (result.error || 'Unknown error'));
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAIResultReceived = (aiResult: Record<string, any>, source: 'voice' | 'image' = 'voice') => {
    // Transform AI result to form data
    const formData = transformAIResultToFormData(aiResult, source);
    setAiFormData(formData);
    // Close the AI modal (voice/image) and open the create transaction modal
    setIsVoiceModalOpen(false);
    setIsImageModalOpen(false);
    setIsCreateModalOpen(true);
  };

  // Format data for display
  const displayTransactions = (transactions || []).map(t => ({
    id: t.id,
    title: t.description || t.category,
    category: t.category,
    date: t.date,
    amount: t.amount,
    type: t.type,
  }));

  // Client-side search filter (if needed for search term not handled by API)
  const filteredTransactions = filterState.search
    ? displayTransactions.filter((t) => {
        const searchLower = filterState.search!.toLowerCase();
        return (
          t.title.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower)
        );
      })
    : displayTransactions;

  // Group transactions by Date
  const groupedTransactions = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) return [];

    const groups: {
      dateKey: string;
      dateLabel: string;
      items: typeof filteredTransactions;
      totalIncome: number;
      totalExpense: number;
    }[] = [];

    const groupMap = new Map<string, typeof filteredTransactions>();

    filteredTransactions.forEach((tx) => {
      let dateKey = tx.date;
      let dateLabel = tx.date;

      // Parse format: dd/mm/yyyy hh:mm or ISO
      const regex = /^(\d{2})\/(\d{2})\/(\d{4})/;
      const match = tx.date.match(regex);

      if (match) {
        const [, day, month, year] = match;
        dateKey = `${year}-${month}-${day}`;

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        if (dateKey === todayStr) {
          dateLabel = locale === 'vi' ? `Hôm nay (${day}/${month}/${year})` : `Today (${day}/${month}/${year})`;
        } else if (dateKey === yesterdayStr) {
          dateLabel = locale === 'vi' ? `Hôm qua (${day}/${month}/${year})` : `Yesterday (${day}/${month}/${year})`;
        } else {
          dateLabel = `${day}/${month}/${year}`;
        }
      } else {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dateKey = `${year}-${month}-${day}`;
          dateLabel = d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
        }
      }

      if (!groupMap.has(dateKey)) {
        const newArr: typeof filteredTransactions = [];
        groupMap.set(dateKey, newArr);
        groups.push({
          dateKey,
          dateLabel,
          items: newArr,
          totalIncome: 0,
          totalExpense: 0,
        });
      }

      const group = groups.find((g) => g.dateKey === dateKey)!;
      group.items.push(tx);
      const isIncome = tx.type.toLowerCase() === 'income';
      if (isIncome) {
        group.totalIncome += Math.abs(tx.amount);
      } else {
        group.totalExpense += Math.abs(tx.amount);
      }
    });

    return groups;
  }, [filteredTransactions, locale]);

  // Stats are retrieved directly from the backend via totalBalance, totalIncome, totalExpenses state variables

  if (isInitializing) {
    return (
      <SidebarLayout>
        <Heading level={2}>{t('common.loading')}</Heading>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarLayout>
      <div className="space-y-5">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading level={2}>
              {t('transactions.title')}
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              {t('transactions.subtitle')}
            </Text>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={() => setIsExcelExportOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
              disabled={transactions.length === 0}
            >
              <MdFileDownload className="w-5 h-5" />
              {t('transactions.exportExcel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsMethodModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              {t('transactions.addTransaction')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label={t('transactions.totalBalance')}
            value={formatVietnamsePrice(totalBalance)}
            icon={<MdAccountBalanceWallet className="w-6 h-6" style={{ color: colors.interactive.primary }} />}
          />
          <StatCard
            label={t('transactions.totalIncome')}
            value={formatVietnamsePrice(totalIncome)}
            icon={<MdTrendingUp className="w-6 h-6" style={{ color: '#10B981' }} />}
            trend={{ direction: 'up', percentage: 12 }}
          />
          <StatCard
            label={t('transactions.totalExpenses')}
            value={formatVietnamsePrice(totalExpenses)}
            icon={<MdTrendingDown className="w-6 h-6" style={{ color: '#EF4444' }} />}
            trend={{ direction: 'down', percentage: 8 }}
          />
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="mb-4">
            <div className="mb-6">
              <Heading level={3}>{t('transactions.allTransactions')}</Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                {t('transactions.searchFilterSort')}
              </Text>
            </div>

            {/* Transaction Search, Filter & Sort Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border" style={{ backgroundColor: `${colors.surface.secondary}40`, borderColor: colors.border.light }}>
              {/* Search & Filter Component */}
              <div className="flex-1 min-w-0">
                <TransactionFilter
                  onFilterChange={setFilterState}
                  initialFilters={filterState}
                />
              </div>

              {/* Custom Sort Bar */}
              <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0" style={{ borderTopColor: `${colors.border.light}80` }}>
                <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap pl-1" style={{ color: colors.text.secondary }}>
                  <MdSort className="w-4 h-4" style={{ color: colors.interactive.primary }} />
                  <span>{t('transactions.sortBy')}:</span>
                </div>

                {/* Custom Popover Dropdown for Sort Field */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer hover:shadow-sm"
                    style={{
                      backgroundColor: colors.surface.primary,
                      color: colors.text.primary,
                      borderColor: colors.border.light,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {sortBy === 'date' && <MdCalendarToday className="w-4 h-4 text-primary" />}
                      {sortBy === 'amount' && <MdAttachMoney className="w-4 h-4 text-emerald-500" />}
                      {sortBy === 'category' && <MdCategory className="w-4 h-4 text-purple-500" />}
                      {sortBy === 'type' && <MdOutlineSwapHoriz className="w-4 h-4 text-blue-500" />}
                      {sortBy === 'description' && <MdShortText className="w-4 h-4 text-amber-500" />}
                      <span>
                        {sortBy === 'date' && t('transactions.sortOptions.date')}
                        {sortBy === 'amount' && t('transactions.sortOptions.amount')}
                        {sortBy === 'category' && t('transactions.sortOptions.category')}
                        {sortBy === 'type' && t('transactions.sortOptions.type')}
                        {sortBy === 'description' && t('transactions.sortOptions.description')}
                      </span>
                    </div>
                    <MdExpandMore
                      className={`w-4 h-4 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`}
                      style={{ color: colors.text.secondary }}
                    />
                  </button>

                  {/* Dropdown Popover Menu */}
                  {isSortDropdownOpen && (
                    <div
                      className="absolute right-0 mt-1.5 w-44 rounded-2xl shadow-xl border p-1.5 z-50 animate-in fade-in zoom-in-95"
                      style={{
                        backgroundColor: colors.surface.primary,
                        borderColor: colors.border.light,
                      }}
                    >
                      {[
                        { value: 'date', label: t('transactions.sortOptions.date'), icon: <MdCalendarToday className="w-4 h-4 text-primary" /> },
                        { value: 'amount', label: t('transactions.sortOptions.amount'), icon: <MdAttachMoney className="w-4 h-4 text-emerald-500" /> },
                        { value: 'category', label: t('transactions.sortOptions.category'), icon: <MdCategory className="w-4 h-4 text-purple-500" /> },
                        { value: 'type', label: t('transactions.sortOptions.type'), icon: <MdOutlineSwapHoriz className="w-4 h-4 text-blue-500" /> },
                        { value: 'description', label: t('transactions.sortOptions.description'), icon: <MdShortText className="w-4 h-4 text-amber-500" /> },
                      ].map((option) => {
                        const isSelected = sortBy === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSortBy(option.value as any);
                              setIsSortDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors hover:cursor-pointer"
                            style={{
                              backgroundColor: isSelected ? `${colors.interactive.primary}15` : 'transparent',
                              color: isSelected ? colors.interactive.primary : colors.text.primary,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {option.icon}
                              <span>{option.label}</span>
                            </div>
                            {isSelected && <MdCheck className="w-4 h-4" style={{ color: colors.interactive.primary }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Interactive Sort Order Direction Toggle Button */}
                <button
                  type="button"
                  onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                  title={sortOrder === 'DESC' ? t('transactions.sortOptions.descending') : t('transactions.sortOptions.ascending')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all hover:bg-opacity-80 cursor-pointer whitespace-nowrap"
                  style={{
                    backgroundColor: colors.surface.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.light,
                  }}
                >
                  {sortOrder === 'DESC' ? (
                    <>
                      <MdArrowDownward className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline">{t('transactions.sortOptions.descending')}</span>
                    </>
                  ) : (
                    <>
                      <MdArrowUpward className="w-4 h-4 text-indigo-500" />
                      <span className="hidden sm:inline">{t('transactions.sortOptions.ascending')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="space-y-3 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <MdRefresh 
                    className="w-8 h-8 animate-spin" 
                    style={{ color: colors.interactive.primary }}
                  />
                  <Text style={{ color: colors.text.secondary }} className="text-sm">
                    {t('transactions.loadingTransactions')}
                  </Text>
                </div>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <>
                {sortBy === 'date' ? (
                  <div className="space-y-6">
                    {groupedTransactions.map((group) => (
                      <div key={group.dateKey} className="space-y-2.5">
                        {/* Date Group Header - Minimal Line Divider */}
                        <div className="flex items-center gap-3 pt-3 pb-1">
                          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm whitespace-nowrap" style={{ color: colors.text.secondary }}>
                            <MdCalendarToday className="w-4 h-4" style={{ color: colors.interactive.primary }} />
                            <span>{group.dateLabel}</span>
                          </div>

                          {/* Horizontal Line Divider */}
                          <div className="flex-1 h-[1px]" style={{ backgroundColor: `${colors.border.light}` }} />

                          {/* Daily Totals */}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold whitespace-nowrap">
                            {group.totalIncome > 0 && (
                              <span style={{ color: '#10B981' }}>
                                +{formatVietnamsePrice(group.totalIncome)}
                              </span>
                            )}
                            {group.totalExpense > 0 && (
                              <span style={{ color: '#EF4444' }}>
                                -{formatVietnamsePrice(group.totalExpense)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Grouped Rows */}
                        <div className="space-y-2">
                          {group.items.map((transaction) => (
                            <TransactionRow
                              key={transaction.id}
                              id={transaction.id}
                              title={transaction.title}
                              category={transaction.category}
                              date={transaction.date}
                              amount={transaction.amount}
                              type={transaction.type}
                              showTimeOnly={true}
                              onEdit={handleEditClick}
                              onDelete={handleDeleteClick}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Flat list when sorting by Amount, Category, Type, etc. */
                  <div className="space-y-2.5">
                    {filteredTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        id={transaction.id}
                        title={transaction.title}
                        category={transaction.category}
                        date={transaction.date}
                        amount={transaction.amount}
                        type={transaction.type}
                        showTimeOnly={false}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                )}
                {/* Pagination */}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.border.light }}>
                  <div className="space-y-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page);
                        loadTransactions(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-center" style={{ color: colors.text.secondary }}>
                      <Text variant="caption" className="text-sm text-center">
                        {t('transactions.showing', {
                          start: ((currentPage - 1) * ITEMS_PER_PAGE) + 1,
                          end: Math.min(currentPage * ITEMS_PER_PAGE, totalElements),
                          total: totalElements
                        })}
                      </Text>
                      <Text variant="caption" className="text-sm text-center">
                        <span className="hidden sm:inline">•</span> {t('transactions.perPage', { perPage: ITEMS_PER_PAGE })}
                      </Text>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Text style={{ color: colors.text.secondary }}>
                  {t('transactions.noTransactions')}
                </Text>
              </div>
            )}
          </div>
        </Card>

        {/* Create Transaction Modal */}
        <CreateTransactionModal
          isOpen={isCreateModalOpen}
          initialData={aiFormData}
          onClose={() => {
            setIsCreateModalOpen(false);
            setAiFormData(null);
          }}
          onSuccess={() => {
            // Refresh transaction list
            loadTransactions();
          }}
        />

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          isOpen={isEditModalOpen}
          transactionId={editingTransactionId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTransactionId(null);
          }}
          onSuccess={() => {
            // Refresh transaction list
            loadTransactions();
          }}
        />

        {/* Transaction Method Selection Modal */}
        <TransactionMethodModal
          isOpen={isMethodModalOpen}
          onClose={() => setIsMethodModalOpen(false)}
          onSelectForm={() => {
            setIsMethodModalOpen(false);
            setIsCreateModalOpen(true);
          }}
          onSelectImage={() => {
            setIsMethodModalOpen(false);
            setIsImageModalOpen(true);
          }}
          onSelectVoice={() => {
            setIsMethodModalOpen(false);
            setIsVoiceModalOpen(true);
          }}
          onSelectExcel={() => {
            setIsMethodModalOpen(false);
            setIsExcelImportOpen(true);
          }}
        />

        {/* Image Bill Upload Modal */}
        <ImageBillUploadModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          onSuccess={() => setIsImageModalOpen(false)}
          onAIResultReceived={handleAIResultReceived}
        />

        {/* Voice Record Modal */}
        <VoiceRecordModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onSuccess={() => setIsVoiceModalOpen(false)}
          onAIResultReceived={handleAIResultReceived}
        />

        {/* Excel Import Modal */}
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          onSuccess={() => {
            loadTransactions();
          }}
        />

        {/* Excel Export Modal */}
        <ExcelExportModal
          isOpen={isExcelExportOpen}
          onClose={() => setIsExcelExportOpen(false)}
          totalPages={totalPages}
          totalElements={totalElements}
          currentPage={currentPage}
          currentTransactions={transactions}
          activeFilters={{
            ...filterState,
            sortBy,
            sortOrder,
          }}
        />
      </div>
    </SidebarLayout>
  );
}
