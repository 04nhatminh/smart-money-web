'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import { BudgetProgressCard, CreateBudgetModal, EditBudgetModal, DeleteConfirmationModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Budget } from '@/types/budget.api';
import { formatVietnamsePrice } from '@/lib/format';
import { MdAdd } from 'react-icons/md';

export default function BudgetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();
  const { listBudgets, deleteBudget, isLoading } = useBudgets();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Load budgets
  useEffect(() => {
    if (isAuthenticated) {
      loadBudgets();
    }
  }, [isAuthenticated, currentMonth, currentYear]);

  const loadBudgets = async () => {
    try {
      setError(null);
      const result = await listBudgets(currentMonth, currentYear);

      if (result.success && result.data) {
        const budgetList = result.data.items || result.data.content || result.data.budgets || [];
        setBudgets(budgetList);
      } else {
        setError(result.error || 'Failed to load budgets');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load budgets';
      setError(errorMsg);
    }
  };

  const handleDeleteClick = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;

    try {
      setError(null);
      const result = await deleteBudget(budgetToDelete);

      if (result.success) {
        setBudgets(budgets.filter(b => b.budgetId !== budgetToDelete));
        setIsDeleteModalOpen(false);
        setBudgetToDelete(null);
      } else {
        setError(result.error || 'Failed to delete budget');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete budget';
      setError(errorMsg);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setBudgetToDelete(null);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentYear(parseInt(e.target.value));
  };

  if (isInitializing) {
    return (
      <SidebarLayout>
        <Heading level={2}>Loading...</Heading>
      </SidebarLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate summary statistics
  const totalLimit = budgets.reduce((sum, b) => sum + b.amountLimit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  return (
    <SidebarLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Heading level={2}>Budget Management</Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              Track and manage your spending budgets
            </Text>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <MdAdd className="w-5 h-5" />
            Create Budget
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
          >
            <Text className="text-sm font-medium">{error}</Text>
          </div>
        )}

        {/* Month and Year Selector */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              Select Month & Year
            </label>
            <div className="flex gap-2">
              <select
                value={currentMonth}
                onChange={handleMonthChange}
                className="flex-1 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: colors.border.light,
                  backgroundColor: colors.surface.secondary,
                  color: colors.text.primary,
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'short' })}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="flex-1 px-3 py-2 rounded-lg border"
                style={{
                  borderColor: colors.border.light,
                  backgroundColor: colors.surface.secondary,
                  color: colors.text.primary,
                }}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              Total Budget
            </Text>
            <Text className="text-2xl font-bold mt-2" style={{ color: colors.text.primary }}>
              {formatVietnamsePrice(totalLimit)}
            </Text>
          </div>

          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              Total Spent
            </Text>
            <Text className="text-2xl font-bold mt-2" style={{ color: '#EF4444' }}>
              {formatVietnamsePrice(totalSpent)}
            </Text>
          </div>

          <div
            className="rounded-lg p-4 border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Text className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              Remaining
            </Text>
            <Text className="text-2xl font-bold mt-2" style={{ color: '#10B981' }}>
              {formatVietnamsePrice(totalRemaining)}
            </Text>
          </div>
        </div>

        {/* Budgets Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <Text style={{ color: colors.text.secondary }}>Loading budgets...</Text>
          </div>
        ) : budgets.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center border-2 border-dashed"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.secondary,
            }}
          >
            <Text style={{ color: colors.text.secondary }}>
              No budgets yet. Create one to get started!
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map(budget => (
              <BudgetProgressCard
                key={budget.budgetId}
                budget={budget}
                onEdit={(budgetId) => {
                  setSelectedBudgetId(budgetId);
                  setIsEditModalOpen(true);
                }}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadBudgets}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      <EditBudgetModal
        isOpen={isEditModalOpen}
        budgetId={selectedBudgetId}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBudgetId(null);
        }}
        onSuccess={loadBudgets}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </SidebarLayout>
  );
}
