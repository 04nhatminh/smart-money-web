'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, StatCard, TransactionRow, CreateTransactionModal, EditTransactionModal, TransactionMethodModal, ImageBillUploadModal, VoiceRecordModal, TransactionFilter, Pagination, type TransactionFilterState } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions, type TransactionFilters } from '@/hooks/useTransactions';
import { transformAIResultToFormData } from '@/lib/ai-result-transformer';
import { MdAdd } from 'react-icons/md';
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
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [aiFormData, setAiFormData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
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
    } else {
      setTransactions([]);
      setTotalPages(1);
      setTotalElements(0);
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

  // Calculate stats
  const totalBalance = displayTransactions.reduce((acc, t) => {
    return t.type === 'INCOME' ? acc + t.amount : acc - t.amount;
  }, 0);

  const totalIncome = displayTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = displayTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

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
        <div className="flex items-center justify-between">
          <div>
            <Heading level={2}>
              {t('transactions.title')}
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              {t('transactions.subtitle')}
            </Text>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsMethodModalOpen(true)}
            className="flex items-center gap-2"
          >
            <MdAdd className="w-5 h-5" />
            {t('transactions.addTransaction')}
          </Button>
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

            {/* Transaction Filter Component */}
            <TransactionFilter
              onFilterChange={setFilterState}
              initialFilters={filterState}
            />

            {/* Sort Options */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MdSort className="w-5 h-5" style={{ color: colors.text.secondary }} />
                <Text style={{ color: colors.text.secondary }} className="text-sm font-medium">
                  {t('transactions.sortBy')}
                </Text>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.border.light,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.border.light}`,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                className="focus:outline-none focus:ring-2"
              >
                <option value="date">{t('transactions.sortOptions.date')}</option>
                <option value="amount">{t('transactions.sortOptions.amount')}</option>
                <option value="category">{t('transactions.sortOptions.category')}</option>
                <option value="type">{t('transactions.sortOptions.type')}</option>
                <option value="description">{t('transactions.sortOptions.description')}</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                style={{
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  borderColor: colors.border.light,
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${colors.border.light}`,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
                className="focus:outline-none focus:ring-2"
              >
                <option value="DESC">{t('transactions.sortOptions.descending')}</option>
                <option value="ASC">{t('transactions.sortOptions.ascending')}</option>
              </select>
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
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    id={transaction.id}
                    title={transaction.title}
                    category={transaction.category}
                    date={transaction.date}
                    amount={transaction.amount}
                    type={transaction.type}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                ))}
                {/* Pagination */}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: colors.text.secondary }}>
                  <div className="space-y-3">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => {
                        setCurrentPage(page);
                        loadTransactions(page);
                      }}
                    />
                    <div className="flex items-center justify-center gap-4" style={{ color: colors.text.secondary }}>
                      <Text variant="caption" className="text-sm">
                        {t('transactions.showing', {
                          start: ((currentPage - 1) * ITEMS_PER_PAGE) + 1,
                          end: Math.min(currentPage * ITEMS_PER_PAGE, totalElements),
                          total: totalElements
                        })}
                      </Text>
                      <Text variant="caption" className="text-sm">
                        • {t('transactions.perPage', { perPage: ITEMS_PER_PAGE })}
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
      </div>
    </SidebarLayout>
  );
}
