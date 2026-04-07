'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { Card, StatCard, TransactionRow, SearchBar } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { MdAdd } from 'react-icons/md';
import { MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

interface Transaction {
  id: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with real data from API
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Salary Deposit',
      category: 'Salary',
      date: '2024-03-15',
      amount: 5000,
      type: 'income',
    },
    {
      id: '2',
      title: 'Grocery Shopping',
      category: 'Food',
      date: '2024-03-14',
      amount: 120.5,
      type: 'expense',
    },
    {
      id: '3',
      title: 'Coffee Shop',
      category: 'Food',
      date: '2024-03-14',
      amount: 15.8,
      type: 'expense',
    },
    {
      id: '4',
      title: 'Rent Payment',
      category: 'Housing',
      date: '2024-03-13',
      amount: 1200,
      type: 'expense',
    },
  ];

  const filteredTransactions = mockTransactions.filter((t) => {
    const matchesFilter = selectedFilter === 'all' || t.type === selectedFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalBalance = 4358.5;
  const totalIncome = 5800;
  const totalExpenses = 1441.5;

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
            onClick={() => router.push(`/${locale}/transaction/new`)}
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

            <SearchBar
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  id={transaction.id}
                  title={transaction.title}
                  category={transaction.category}
                  date={transaction.date}
                  amount={transaction.amount}
                  type={transaction.type}
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
      </div>
    </SidebarLayout>
  );
}
