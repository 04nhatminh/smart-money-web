'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, StatCard, TransactionRow, CreateTransactionModal, EditTransactionModal, TransactionMethodModal, ImageBillUploadModal, VoiceRecordModal, TransactionFilter, Pagination, type TransactionFilterState } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions, type TransactionFilters } from '@/hooks/useTransactions';
import { transformAIResultToFormData } from '@/lib/ai-result-transformer';
import { MdAdd } from 'react-icons/md';
import { MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown, MdRefresh } from 'react-icons/md';
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

export default function DashboardPage() {
  const { user, isInitializing } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();
  const { isLoading, listTransactions, deleteTransaction } = useTransactions();
  const [filterState, setFilterState] = useState<TransactionFilterState>({});
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

  // Load transactions after auth is initialized or filter changes
  useEffect(() => {
    if (!isInitializing) {
      setCurrentPage(1); // Reset to first page when filters change
      loadTransactions(1);
    }
  }, [isInitializing, filterState]);

  const loadTransactions = async (page: number = currentPage) => {
    const apiFilters: TransactionFilters = {
      page: page - 1, // API uses 0-indexed pages
      size: ITEMS_PER_PAGE,
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
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setDeleteLoading(true);
      const result = await deleteTransaction(id);
      if (result.success) {
        setTransactions(transactions.filter(t => t.id !== id));
      } else {
        alert('Failed to delete transaction: ' + (result.error || 'Unknown error'));
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

  return (
    <SidebarLayout>
      <div className="space-y-5">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <Heading level={2}>
              Welcome back, {user?.fullName || user?.username || 'User'}!
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              Here's your financial overview
            </Text>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsMethodModalOpen(true)}
            className="flex items-center gap-2"
          >
            <MdAdd className="w-5 h-5" />
            Add Transaction
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Balance"
            value={formatVietnamsePrice(totalBalance)}
            icon={<MdAccountBalanceWallet className="w-6 h-6" style={{ color: colors.interactive.primary }} />}
          />
          <StatCard
            label="Total Income"
            value={formatVietnamsePrice(totalIncome)}
            icon={<MdTrendingUp className="w-6 h-6" style={{ color: '#10B981' }} />}
            trend={{ direction: 'up', percentage: 12 }}
          />
          <StatCard
            label="Total Expenses"
            value={formatVietnamsePrice(totalExpenses)}
            icon={<MdTrendingDown className="w-6 h-6" style={{ color: '#EF4444' }} />}
            trend={{ direction: 'down', percentage: 8 }}
          />
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="mb-4">
            <div className="mb-6">
              <Heading level={3}>Recent Transactions</Heading>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Track all your income and expenses
              </Text>
            </div>

            {/* Transaction Filter Component */}
            <TransactionFilter
              onFilterChange={setFilterState}
              initialFilters={filterState}
            />
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <MdRefresh 
                    className="w-8 h-8 animate-spin" 
                    style={{ color: colors.interactive.primary }}
                  />
                  <Text style={{ color: colors.text.secondary }} className="text-sm">
                    Loading transactions...
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
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalElements)} of {totalElements} transactions
                      </Text>
                      <Text variant="caption" className="text-sm">
                        • {ITEMS_PER_PAGE} per page
                      </Text>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Text style={{ color: colors.text.secondary }}>
                  No transactions found
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
