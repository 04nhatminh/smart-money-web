'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, StatCard, TransactionRow, CreateTransactionModal, EditTransactionModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { MdAdd } from 'react-icons/md';
import { MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

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
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();
  const { isLoading, listTransactions, deleteTransaction } = useTransactions();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const result = await listTransactions(0, 50);
    if (result.success && result.data) {
      setTransactions((result.data as any).transactions || result.data.content || []);
    } else {
      setTransactions([]);
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

  // Format data for display
  const displayTransactions = (transactions || []).map(t => ({
    id: t.id,
    title: t.description || t.category,
    category: t.category,
    date: t.date,
    amount: t.amount,
    type: t.type,
  }));

  const filteredTransactions = displayTransactions.filter((t) => {
    const matchesFilter = selectedFilter === 'all' || (
      selectedFilter === 'income' && t.type === 'INCOME'
    ) || (
      selectedFilter === 'expense' && t.type === 'EXPENSE'
    );
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <Heading level={1} style={{ color: colors.text.primary }}>
              Welcome back, {user?.fullName || user?.username || 'User'}!
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="text-sm">
              Here's your financial overview
            </Text>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
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
            value={`$${totalBalance.toFixed(2)}`}
            icon={<MdAccountBalanceWallet className="w-6 h-6" style={{ color: colors.interactive.primary }} />}
          />
          <StatCard
            label="Total Income"
            value={`$${totalIncome.toFixed(0)}`}
            icon={<MdTrendingUp className="w-6 h-6" style={{ color: '#10B981' }} />}
            trend={{ direction: 'up', percentage: 12 }}
          />
          <StatCard
            label="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
            icon={<MdTrendingDown className="w-6 h-6" style={{ color: '#EF4444' }} />}
            trend={{ direction: 'down', percentage: 8 }}
          />
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Heading level={3}>Recent Transactions</Heading>
                <Text style={{ color: colors.text.secondary }} className="text-sm">
                  Track all your income and expenses
                </Text>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFilter === 'all'
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  style={{
                    backgroundColor: selectedFilter === 'all' ? colors.interactive.primary : colors.surface.secondary,
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedFilter('income')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFilter === 'income'
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  style={{
                    backgroundColor: selectedFilter === 'income' ? colors.interactive.primary : colors.surface.secondary,
                  }}
                >
                  Income
                </button>
                <button
                  onClick={() => setSelectedFilter('expense')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedFilter === 'expense'
                      ? 'text-white'
                      : 'text-gray-600'
                  }`}
                  style={{
                    backgroundColor: selectedFilter === 'expense' ? colors.interactive.primary : colors.surface.secondary,
                  }}
                >
                  Expenses
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: colors.surface.secondary,
                borderColor: colors.border.light,
                color: colors.text.primary,
              }}
            />
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Text style={{ color: colors.text.secondary }}>Loading transactions...</Text>
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
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
              ))
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
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            // Refresh transaction list
            loadTransactions();
            setSearchTerm('');
            setSelectedFilter('all');
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
      </div>
    </SidebarLayout>
  );
}
