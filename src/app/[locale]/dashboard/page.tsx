'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, StatCard, TransactionRow, CreateTransactionModal, EditTransactionModal, TransactionMethodModal, ImageBillUploadModal, VoiceRecordModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useTransactions } from '@/hooks/useTransactions';
import { transformAIResultToFormData } from '@/lib/ai-result-transformer';
import { MdAdd } from 'react-icons/md';
import { MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import { MdAttachMoney, MdFastfood, MdDirectionsCar, MdShoppingBag, MdLightbulb, MdLocalMovies, MdFavorite, MdSchool, MdShoppingCart, MdHelpOutline } from 'react-icons/md';
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

const EXPENSE_CATEGORIES = [
  'FOOD',
  'TRANSPORTATION',
  'CLOTHING',
  'UTILITIES',
  'ENTERTAINMENT',
  'HEALTH',
  'EDUCATION',
  'SHOPPING',
  'OTHER',
];

const getCategoryIcon = (category: string): React.ReactNode => {
  const iconMap: { [key: string]: React.ReactNode } = {
    FOOD: <MdFastfood className="w-6 h-6" />,
    TRANSPORTATION: <MdDirectionsCar className="w-6 h-6" />,
    CLOTHING: <MdShoppingBag className="w-6 h-6" />,
    UTILITIES: <MdLightbulb className="w-6 h-6" />,
    ENTERTAINMENT: <MdLocalMovies className="w-6 h-6" />,
    HEALTH: <MdFavorite className="w-6 h-6" />,
    EDUCATION: <MdSchool className="w-6 h-6" />,
    SHOPPING: <MdShoppingCart className="w-6 h-6" />,
    OTHER: <MdHelpOutline className="w-6 h-6" />,
  };
  return iconMap[category] || <MdHelpOutline className="w-6 h-6" />;
};

export default function DashboardPage() {
  const { user, isInitializing } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();
  const { isLoading, listTransactions, deleteTransaction } = useTransactions();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [aiFormData, setAiFormData] = useState<any>(null);

  // Load transactions after auth is initialized
  useEffect(() => {
    if (!isInitializing) {
      loadTransactions();
    }
  }, [isInitializing]);

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

  const filteredTransactions = displayTransactions.filter((t) => {
    const matchesFilter = selectedFilter === 'all' || (
      selectedFilter === 'income' && t.type === 'INCOME'
    ) || (
      selectedFilter === 'expense' && t.type === 'EXPENSE'
    );
    
    // Only apply category filter for expense transactions
    const matchesCategory = selectedFilter !== 'expense' || selectedCategory === 'all' || t.category === selectedCategory;
    
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesCategory && matchesSearch;
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
            <div className="flex items-center justify-between mb-4">
              <div>
                <Heading level={3}>Recent Transactions</Heading>
                <Text style={{ color: colors.text.secondary }} className="text-sm">
                  Track all your income and expenses
                </Text>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedFilter('all');
                    setSelectedCategory('all');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all hover:cursor-pointer ${
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
                  onClick={() => {
                    setSelectedFilter('income');
                    setSelectedCategory('all');
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all hover:cursor-pointer ${
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all hover:cursor-pointer ${
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

            {/* Category Filter - Only shown for EXPENSE */}
            {selectedFilter === 'expense' && (
              <div className="space-y-3 mt-4">
                <Text style={{ color: colors.text.secondary }} className="text-sm font-medium">
                  Filter by Category
                </Text>
                <div className="grid grid-cols-5 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {/* All Categories Button */}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: selectedCategory === 'all' ? colors.interactive.primary : colors.surface.secondary,
                      borderColor: selectedCategory === 'all' ? colors.interactive.primary : colors.border.light,
                    }}
                  >
                    <MdAttachMoney
                      className="w-6 h-6 mb-1"
                      style={{ color: selectedCategory === 'all' ? '#ffffff' : colors.text.primary }}
                    />
                    <span
                      className="text-xs font-medium text-center"
                      style={{ color: selectedCategory === 'all' ? '#ffffff' : colors.text.primary }}
                    >
                      All
                    </span>
                  </button>

                  {/* Category Buttons */}
                  {EXPENSE_CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all hover:cursor-pointer hover:opacity-80"
                      style={{
                        backgroundColor: selectedCategory === category ? colors.interactive.primary : colors.surface.secondary,
                        borderColor: selectedCategory === category ? colors.interactive.primary : colors.border.light,
                      }}
                    >
                      <div
                        style={{ color: selectedCategory === category ? '#ffffff' : colors.text.primary }}
                      >
                        {getCategoryIcon(category)}
                      </div>
                      <span
                        className="text-xs font-medium text-center mt-1"
                        style={{ color: selectedCategory === category ? '#ffffff' : colors.text.primary }}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          initialData={aiFormData}
          onClose={() => {
            setIsCreateModalOpen(false);
            setAiFormData(null);
          }}
          onSuccess={() => {
            // Refresh transaction list
            loadTransactions();
            setSearchTerm('');
            setSelectedFilter('all');
            setAiFormData(null);
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
