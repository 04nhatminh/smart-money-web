'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Alert } from '@/components/atoms';
import { BudgetProgressCard, CreateBudgetModal, CreateBulkBudgetsModal, EditBudgetModal, DeleteConfirmationModal, DatePeriodSelector, GenerateBudgetModal } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { Budget } from '@/types/budget.api';
import { formatVietnamsePrice } from '@/lib/format';
import { MdAdd, MdAutoAwesome } from 'react-icons/md';

export default function BudgetsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();
  const { listBudgets, deleteBudget, isLoading } = useBudgets();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateBulkModalOpen, setIsCreateBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGenerateBudgetModalOpen, setIsGenerateBudgetModalOpen] = useState(false);
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
        setError(result.error || t('budgets.failedLoad'));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('budgets.failedLoad');
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
        setError(result.error || t('budgets.failedDelete'));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('budgets.failedDelete');
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
        <Heading level={2}>{t('common.loading')}</Heading>
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
            <Heading level={2}>{t('budgets.title')}</Heading>
            <Text style={{ color: colors.text.secondary }} className="text-lg">
              {t('budgets.subtitle')}
            </Text>
          </div>
           <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsGenerateBudgetModalOpen(true)}
              className="flex items-center gap-2"
              style={{
                border: `2px solid ${colors.interactive.primary}`,
                color: colors.interactive.primary,
                backgroundColor: 'transparent',
                borderRadius: '0.75rem',
              }}
            >
              <MdAutoAwesome className="w-5 h-5" />
              Generate Budget
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsCreateBulkModalOpen(true)}
              className="flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              {t('budgets.createMultiple')}
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              {t('budgets.createBudget')}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert message={error} type="error" onClose={() => setError(null)} />
        )}

        {/* Month and Year Selector */}
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
              {t('budgets.selectMonthYear')}
            </label>
            <DatePeriodSelector
              currentMonth={currentMonth}
              currentYear={currentYear}
              onChange={(month, year) => {
                setCurrentMonth(month);
                setCurrentYear(year);
              }}
            />
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
              {t('budgets.totalBudget')}
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
              {t('budgets.totalSpent')}
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
              {t('budgets.remaining')}
            </Text>
            <Text className="text-2xl font-bold mt-2" style={{ color: '#10B981' }}>
              {formatVietnamsePrice(totalRemaining)}
            </Text>
          </div>
        </div>

        {/* Budgets Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <Text style={{ color: colors.text.secondary }}>{t('budgets.loadingBudgets')}</Text>
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
              {t('budgets.noBudgetsYet')}
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

      <CreateBulkBudgetsModal
        isOpen={isCreateBulkModalOpen}
        onClose={() => setIsCreateBulkModalOpen(false)}
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
        title={t('budgets.deleteTitle')}
        message={t('budgets.deleteConfirm')}
        confirmLabel={t('budgets.delete')}
        cancelLabel={t('budgets.cancel')}
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <GenerateBudgetModal
        isOpen={isGenerateBudgetModalOpen}
        onClose={() => setIsGenerateBudgetModalOpen(false)}
        onSuccess={loadBudgets}
      />
    </SidebarLayout>
  );
}
