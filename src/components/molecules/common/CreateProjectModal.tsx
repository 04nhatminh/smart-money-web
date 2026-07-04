'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { useGroups } from '@/hooks/useGroups';
import { useUserFinancial } from '@/hooks/useUserFinancial';
import { ProjectAdvisorModeModal, ProjectAdvisorResultModal } from '.';
import { CreateGroupModal } from './CreateGroupModal';
import { GenerateBudgetModal } from './GenerateBudgetModal';
import { CreateProjectRequest, ProjectAdvisorResponse } from '@/types/project.api';
import { GroupSummaryResponse } from '@/types/group.api';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose, MdLightbulb, MdAutoAwesome } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (budgetGenerated?: boolean) => void;
  onOpenUserFinancialModal?: () => void;
  usedPriorities?: string[];
  maxProjectsReached?: boolean;
  defaultType?: 'PERSONAL' | 'GROUP';
  defaultGroupId?: string;
}

type ProjectType = 'PERSONAL' | 'GROUP';
type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH';
type ProjectMode = 'RELAXED' | 'URGENT';
const CURRENCY = 'VND'; // Fixed currency

interface FormData {
  name: string;
  description: string;
  type: ProjectType;
  priority: ProjectPriority;
  targetAmount: string;
  currency: string;
  deadline: string;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenUserFinancialModal,
  usedPriorities = [],
  maxProjectsReached = false,
  defaultType,
  defaultGroupId,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const { isLoading: projectsLoading, createProject, projectAdvisor } = useProjects();
  const { listGroups, getGroupProjectSuggestions, createGroupProject, isLoading: groupsLoading } = useGroups();
  const { getUserFinancial } = useUserFinancial();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const minDeadlineStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();

  // Advisor flow states
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isAdvisorResultModalOpen, setIsAdvisorResultModalOpen] = useState(false);
  const [advisorData, setAdvisorData] = useState<ProjectAdvisorResponse | null>(null);
  const [userIncomeData, setUserIncomeData] = useState<any>(null);

  // Group states
  const [groups, setGroups] = useState<GroupSummaryResponse[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [totalMonths, setTotalMonths] = useState('1');
  const [suggestType, setSuggestType] = useState<'amount' | 'months'>('amount');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const [reactiveSuggestions, setReactiveSuggestions] = useState<{
    totalCapacity: number;
    suggestedMonths: number;
    suggestedAmount: number;
    targetAmount: number;
    totalMonths: number;
  } | null>(null);
  const [showReactiveWarning, setShowReactiveWarning] = useState(false);

  // Future options and success modal states
  const [showDateGateOptions, setShowDateGateOptions] = useState(false);
  const [creationOption, setCreationOption] = useState<'SAVE_NOW' | 'START_NEXT_MONTH' | null>(null);
  const [successMode, setSuccessMode] = useState<'WITH_BUDGET' | 'WITHOUT_BUDGET'>('WITH_BUDGET');
  const [isGenerateBudgetOpen, setIsGenerateBudgetOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'PERSONAL',
    priority: 'MEDIUM',
    targetAmount: '',
    currency: 'VND',
    deadline: minDeadlineStr,
  });

  const isLoading = projectsLoading || groupsLoading;

  // Load groups when type is GROUP
  useEffect(() => {
    if (isOpen && formData.type === 'GROUP') {
      loadGroups();
    }
  }, [isOpen, formData.type]);

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        type: defaultType || 'PERSONAL',
        priority: 'MEDIUM',
        targetAmount: '',
        currency: 'VND',
        deadline: minDeadlineStr,
      });
      setSelectedGroupId(defaultGroupId || '');
      setTotalMonths('1');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, defaultType, defaultGroupId, minDeadlineStr]);

  const loadGroups = async () => {
    try {
      const res = await listGroups();
      if (res.success && res.data) {
        // filter groups where ADMIN and LOCKED
        const filtered = res.data.filter(
          (g) => g.status === 'LOCKED' && g.myRole === 'ADMIN'
        );
        setGroups(filtered);
        if (filtered.length > 0 && !selectedGroupId) {
          setSelectedGroupId(filtered[0].groupId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      setError(null);
    } else {
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.paddingRight = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'targetAmount') {
      const formatted = formatAmountInput(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const getFirstOfNextMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toISOString().split('T')[0];
  };

  const handleConfirmOption = (option: 'SAVE_NOW' | 'START_NEXT_MONTH') => {
    setCreationOption(option);
    setShowDateGateOptions(false);
    setIsModeModalOpen(true);
  };

  const handleSuccessClose = () => {
    setSuccess(false);
    onClose();
    onSuccess?.(false);
  };

  const handleSuggest = async () => {
    setError(null);
    if (!selectedGroupId) {
      setError(t('projects.createModal.errors.selectGroup'));
      return;
    }

    const payload: any = { groupId: selectedGroupId };
    if (suggestType === 'amount') {
      const amountVal = parseFormattedNumber(formData.targetAmount);
      if (!amountVal || amountVal <= 0) {
        setError(t('projects.createModal.errors.enterAmount'));
        return;
      }
      payload.inputAmount = amountVal;
    } else {
      const monthsVal = parseInt(totalMonths);
      if (!monthsVal || monthsVal <= 0) {
        setError(t('projects.createModal.errors.enterMonths'));
        return;
      }
      payload.inputMonths = monthsVal;
    }

    try {
      const res = await getGroupProjectSuggestions(payload);
      if (res.success && res.data) {
        if (suggestType === 'amount') {
          setTotalMonths(res.data.suggestedMonths.toString());
        } else {
          setFormData(prev => ({
            ...prev,
            targetAmount: formatAmountInput(res.data.suggestedAmount.toString()),
          }));
        }
      } else {
        setError(res.error || t('projects.createModal.errors.failedSuggestions'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleApplySuggestion = (type: 'adjust_months' | 'adjust_amount') => {
    if (!reactiveSuggestions) return;
    if (type === 'adjust_months') {
      setTotalMonths(reactiveSuggestions.suggestedMonths.toString());
    } else {
      setFormData(prev => ({
        ...prev,
        targetAmount: formatAmountInput(reactiveSuggestions.suggestedAmount.toString()),
      }));
    }
    setShowReactiveWarning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError(t('projects.createModal.errors.nameRequired'));
      return;
    }

    const numericAmount = parseFormattedNumber(formData.targetAmount);
    if (!numericAmount || numericAmount <= 0) {
      setError(t('projects.createModal.errors.validAmount'));
      return;
    }

    if (formData.type === 'GROUP') {
      if (!selectedGroupId) {
        setError(t('projects.createModal.errors.selectGroupProject'));
        return;
      }
      const months = parseInt(totalMonths);
      if (!months || months < 1 || months > 60) {
        setError(t('projects.createModal.errors.monthsRange'));
        return;
      }

      // Group Project Capacity Check
      try {
        const suggestionsRes = await getGroupProjectSuggestions({
          groupId: selectedGroupId,
          inputMonths: 1,
        });
        if (suggestionsRes.success && suggestionsRes.data) {
          const totalCapacity = suggestionsRes.data.totalCapacity;
          if (totalCapacity > 0) {
            const monthlyContribution = numericAmount / months;
            if (monthlyContribution > totalCapacity) {
              const suggestedMonthsVal = Math.ceil(numericAmount / totalCapacity);
              const suggestedAmountVal = totalCapacity * months;

              setReactiveSuggestions({
                totalCapacity,
                suggestedMonths: suggestedMonthsVal,
                suggestedAmount: suggestedAmountVal,
                targetAmount: numericAmount,
                totalMonths: months,
              });
              setShowReactiveWarning(true);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error during capacity check:", err);
      }

      // Group Project direct creation
      try {
        const res = await createGroupProject({
          groupId: selectedGroupId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          targetAmount: numericAmount,
          currency: formData.currency,
          totalMonths: months,
        });

        if (res.success) {
          setSuccessMode('WITHOUT_BUDGET');
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onClose();
            onSuccess?.(true);
          }, 1500);
        } else {
          setError(res.error || 'Failed to create group project');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
      return;
    }

    // Personal Project Logic
    if (usedPriorities.includes(formData.priority)) {
      setError(t('projects.createModal.errors.priorityUsed', { priority: t(`projects.priority.${formData.priority}`) }));
      return;
    }

    if (!formData.deadline) {
      setError(t('projects.createModal.errors.deadlineRequired'));
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const minDeadlineDate = new Date();
    minDeadlineDate.setDate(minDeadlineDate.getDate() + 30);
    minDeadlineDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(deadlineDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < minDeadlineDate) {
      setError(t('projects.createModal.errors.deadlineMin'));
      return;
    }

    // Check if user has completed financial setup
    try {
      const financialResult = await getUserFinancial();
      if (!financialResult.success || !financialResult.data) {
        setError(t('financialSetup.setupIncome') || 'Please complete your financial setup first');
        setTimeout(() => {
          onOpenUserFinancialModal?.();
        }, 500);
        return;
      }
    } catch (err) {
      console.error('Error checking financial profile:', err);
      setError(t('financialSetup.setupIncome') || 'Please complete your financial setup first');
      setTimeout(() => {
        onOpenUserFinancialModal?.();
      }, 500);
      return;
    }

    // Date gate check for days 8-31
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth > 7) {
      setShowDateGateOptions(true);
    } else {
      setCreationOption('SAVE_NOW');
      setIsModeModalOpen(true);
    }
  };

  const handleModeSelected = async (mode: ProjectMode) => {
    setIsModeModalOpen(false);
    setError(null);

    try {
      const advisorRequest = {
        name: formData.name.trim(),
        type: formData.type,
        targetAmount: parseFormattedNumber(formData.targetAmount),
        currency: formData.currency.trim(),
        deadline: formData.deadline,
        mode,
      };

      const result = await projectAdvisor(advisorRequest);

      if (result.success && result.data) {
        setAdvisorData(result.data);
        setIsAdvisorResultModalOpen(true);
      } else {
        setError(result.error || 'Failed to get AI recommendation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI recommendation');
    }
  };

  const handleAdvisorAgree = async () => {
    if (!advisorData) return;

    try {
      const dayOfMonth = new Date().getDate();
      const isStartNextMonth = creationOption === 'START_NEXT_MONTH';
      const startDateVal = isStartNextMonth ? getFirstOfNextMonth() : today;
      const bypassVal = (creationOption === 'SAVE_NOW' && dayOfMonth > 7);

      const calculatedDeadline = (() => {
        const d = new Date(startDateVal);
        d.setMonth(d.getMonth() + (advisorData.numberOfMonths - 1));
        return d.toISOString().split('T')[0];
      })();

      const createData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        targetAmount: parseFormattedNumber(formData.targetAmount),
        currency: formData.currency.trim(),
        deadline: calculatedDeadline,
        startDate: startDateVal,
        bypassDateGate: bypassVal,
      };

      const result = await createProject(createData);

      if (result.success) {
        setSuccessMode(isStartNextMonth ? 'WITHOUT_BUDGET' : 'WITH_BUDGET');
        setSuccess(true);
        setIsAdvisorResultModalOpen(false);
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleAdvisorDisagree = async () => {
    setIsAdvisorResultModalOpen(false);
    setError(null);

    try {
      const dayOfMonth = new Date().getDate();
      const isStartNextMonth = creationOption === 'START_NEXT_MONTH';
      const startDateVal = isStartNextMonth ? getFirstOfNextMonth() : today;
      const bypassVal = (creationOption === 'SAVE_NOW' && dayOfMonth > 7);

      const createData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        targetAmount: parseFormattedNumber(formData.targetAmount),
        currency: formData.currency.trim(),
        deadline: formData.deadline,
        startDate: startDateVal,
        bypassDateGate: bypassVal,
      };

      const result = await createProject(createData);

      if (result.success) {
        setSuccessMode(isStartNextMonth ? 'WITHOUT_BUDGET' : 'WITH_BUDGET');
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  const showFormModal = !isModeModalOpen && !isAdvisorResultModalOpen && !showDateGateOptions && !success;

  return (
    <>
      {/* Project Advisor Mode Modal */}
      <ProjectAdvisorModeModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        onSelectMode={handleModeSelected}
        isLoading={isLoading}
      />

      {/* Project Advisor Result Modal */}
      <ProjectAdvisorResultModal
        isOpen={isAdvisorResultModalOpen}
        onClose={() => {
          setIsAdvisorResultModalOpen(false);
          setError(null);
        }}
        onAgree={handleAdvisorAgree}
        onDisagree={handleAdvisorDisagree}
        advisorData={advisorData}
        isLoading={isLoading}
        error={error}
        onClearError={() => setError(null)}
      />

      {/* Create Group Modal nested fallback */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={loadGroups}
      />

      {showFormModal && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999,
            }}
            onClick={onClose}
          />

          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 overflow-hidden"
              style={{ backgroundColor: colors.background.primary }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b sticky top-0 rounded-t-2xl" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
                <Heading level={3} className="m-0">
                  {formData.type === 'PERSONAL' ? t('projects.createModal.titlePersonal') : t('projects.createModal.titleGroup')}
                </Heading>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
                  style={{ color: colors.text.secondary }}
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {success && (
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: `${colors.interactive.success}20`,
                      color: colors.interactive.success,
                    }}
                  >
                    <Text className="font-semibold">{t('projects.createModal.successMessage')}</Text>
                  </div>
                )}

                {error && (
                  <Alert message={error} type="error" onClose={() => setError(null)} />
                )}

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    {t('projects.createModal.typeLabel')} <span style={{ color: colors.interactive.danger }}>*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['PERSONAL', 'GROUP'] as const).map((tVal) => {
                      const isSelected = formData.type === tVal;
                      return (
                        <button
                          key={tVal}
                          type="button"
                          disabled={isLoading}
                          onClick={() => setFormData(prev => ({ ...prev, type: tVal }))}
                          className="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 hover:cursor-pointer"
                          style={{
                            backgroundColor: isSelected ? `${colors.interactive.primary}10` : colors.background.secondary,
                            borderColor: isSelected ? colors.interactive.primary : colors.border.light,
                            borderWidth: isSelected ? '2.5px' : '1px',
                            color: colors.text.primary,
                          }}
                        >
                          <span className="font-semibold text-sm">
                            {tVal === 'PERSONAL' ? t('projects.createModal.personalType') : t('projects.createModal.groupType')}
                          </span>
                          <span className="text-[11px]" style={{ color: colors.text.secondary }}>
                            {tVal === 'PERSONAL' ? t('projects.createModal.personalDesc') : t('projects.createModal.groupDesc')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Group Project: Select Group and Create Group button */}
                {formData.type === 'GROUP' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>
                        {t('projects.createModal.selectGroup')} <span style={{ color: colors.interactive.danger }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreateGroupModalOpen(true)}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: colors.interactive.primary }}
                      >
                        {t('projects.createModal.createGroup')}
                      </button>
                    </div>

                    {groups.length === 0 ? (
                      <div className="p-3 text-center border border-dashed rounded-lg" style={{ borderColor: colors.border.light }}>
                        <Text style={{ color: colors.text.secondary }} className="text-xs">
                          {t('projects.createModal.noGroups')}
                        </Text>
                      </div>
                    ) : (
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2"
                        style={{
                          borderColor: colors.border.light,
                          backgroundColor: colors.background.secondary,
                          color: colors.text.primary,
                        }}
                      >
                        {groups.map(g => (
                          <option key={g.groupId} value={g.groupId}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    {t('projects.createModal.projectName')} <span style={{ color: colors.interactive.danger }}>*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('projects.createModal.projectNamePlaceholder')}
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    {t('projects.createModal.description')}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('projects.createModal.descriptionPlaceholder')}
                    disabled={isLoading}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Personal Project: Priority Selection */}
                {formData.type === 'PERSONAL' && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                      {t('projects.createModal.priority')} <span style={{ color: colors.interactive.danger }}>*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['LOW', 'MEDIUM', 'HIGH'] as const).map((pVal) => {
                        const isUsed = usedPriorities.includes(pVal);
                        const isSelected = formData.priority === pVal;
                        return (
                          <button
                            key={pVal}
                            type="button"
                            disabled={isLoading || isUsed}
                            onClick={() => {
                              if (!isUsed) {
                                setFormData(prev => ({ ...prev, priority: pVal }));
                              }
                            }}
                            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 relative ${isUsed ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer'
                              }`}
                            style={{
                              backgroundColor: isSelected
                                ? `${colors.interactive.primary}10`
                                : colors.background.secondary,
                              borderColor: isSelected
                                ? colors.interactive.primary
                                : colors.border.light,
                              borderWidth: isSelected ? '2.5px' : '1px',
                              color: colors.text.primary,
                            }}
                          >
                            <span className="font-semibold text-xs">{t(`projects.priority.${pVal}`)}</span>
                            {isUsed ? (
                              <span className="text-[9px] font-semibold text-red-500 leading-tight">
                                {t('projects.createModal.alreadyUsed')}
                              </span>
                            ) : (
                              <span className="text-[10px]" style={{ color: colors.text.secondary }}>
                                {t('projects.createModal.available')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    {t('projects.createModal.targetAmount')} <span style={{ color: colors.interactive.danger }}>*</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      disabled={isLoading}
                      required
                      className="flex-1"
                    />
                    <div
                      className="px-3 py-2 rounded-lg border flex items-center"
                      style={{
                        borderColor: colors.border.light,
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary,
                        minWidth: '80px',
                      }}
                    >
                      <span className="font-medium">{CURRENCY}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Project: Deadline, Group Project: Total Months */}
                {formData.type === 'PERSONAL' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                      {t('projects.deadline')} <span style={{ color: colors.interactive.danger }}>*</span>
                    </label>
                    <Input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      min={minDeadlineStr}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                      {t('projects.createModal.totalMonths')} <span style={{ color: colors.interactive.danger }}>*</span>
                    </label>
                    <Input
                      type="number"
                      name="totalMonths"
                      value={totalMonths}
                      onChange={(e) => setTotalMonths(e.target.value)}
                      disabled={isLoading}
                      min={1}
                      max={60}
                      required
                    />
                  </div>
                )}



                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.light }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? t('projects.createModal.creating') : t('projects.createModal.create')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Success Modal */}
      {success && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999,
            }}
            onClick={handleSuccessClose}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 p-8 text-center space-y-6 pointer-events-auto"
              style={{ backgroundColor: colors.background.primary }}
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>

              <div className="space-y-2">
                <Heading level={3} style={{ color: colors.text.primary }} className="m-0">
                  {t('projects.createModal.successTitle')}
                </Heading>
                {successMode === 'WITH_BUDGET' ? (
                  <Text style={{ color: colors.text.secondary }} className="text-sm">
                    {t('projects.createModal.successWithBudget')}
                  </Text>
                ) : (
                  <Text style={{ color: colors.text.secondary }} className="text-sm">
                    {t('projects.createModal.successWithoutBudget')}
                  </Text>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {successMode === 'WITH_BUDGET' ? (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSuccess(false);
                        setIsGenerateBudgetOpen(true);
                      }}
                      className="w-full font-bold flex items-center justify-center gap-2"
                    >
                      <MdAutoAwesome className="w-5 h-5" style={{ color: colors.text.inverse }} />
                      <span>{t('projects.createModal.recalcBudget')}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleSuccessClose}
                      className="w-full"
                    >
                      {t('projects.createModal.later')}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSuccessClose}
                    className="w-full font-bold"
                  >
                    {t('projects.createModal.confirm')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Date Gate Options Modal */}
      {showDateGateOptions && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999,
            }}
            onClick={() => setShowDateGateOptions(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 overflow-hidden pointer-events-auto"
              style={{ backgroundColor: colors.background.primary }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light }}>
                <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>
                  {t('projects.createModal.dateGateTitle')}
                </Heading>
                <button
                  onClick={() => setShowDateGateOptions(false)}
                  className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
                  style={{ color: colors.text.secondary }}
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <Text className="text-sm" style={{ color: colors.text.secondary }}>
                  {t('projects.createModal.dateGateDesc')}
                </Text>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleConfirmOption('SAVE_NOW')}
                    className="w-full p-4 rounded-xl border text-left transition-all hover:bg-gray-50 flex flex-col gap-1 hover:cursor-pointer"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                    }}
                  >
                    <span className="font-bold text-sm" style={{ color: colors.interactive.primary }}>
                      {t('projects.createModal.saveNowTitle')}
                    </span>
                    <span className="text-xs" style={{ color: colors.text.secondary }}>
                      {t('projects.createModal.saveNowDesc')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmOption('START_NEXT_MONTH')}
                    className="w-full p-4 rounded-xl border text-left transition-all hover:bg-gray-50 flex flex-col gap-1 hover:cursor-pointer"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                    }}
                  >
                    <span className="font-bold text-sm" style={{ color: colors.text.primary }}>
                      {t('projects.createModal.startNextMonthTitle')}
                    </span>
                    <span className="text-xs" style={{ color: colors.text.secondary }}>
                      {t('projects.createModal.startNextMonthDesc')}
                    </span>
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowDateGateOptions(false)}
                    className="w-full"
                  >
                    {t('projects.createModal.back')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Generate Budget Modal */}
      <GenerateBudgetModal
        isOpen={isGenerateBudgetOpen}
        onClose={() => {
          setIsGenerateBudgetOpen(false);
          onClose();
          onSuccess?.(false);
        }}
        onSuccess={() => {
          setIsGenerateBudgetOpen(false);
          onClose();
          onSuccess?.(true);
        }}
      />

      {/* Reactive Warning Modal */}
      {showReactiveWarning && reactiveSuggestions && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 999,
            }}
            onClick={() => setShowReactiveWarning(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 overflow-hidden pointer-events-auto"
              style={{ backgroundColor: colors.background.primary }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light }}>
                <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>
                  Cảnh báo hạn mức đóng góp
                </Heading>
                <button
                  onClick={() => setShowReactiveWarning(false)}
                  className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
                  style={{ color: colors.text.secondary }}
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <Text className="text-sm" style={{ color: colors.text.secondary }}>
                  Với hạn mức đóng góp hiện tại của các thành viên, nhóm không thể hoàn thành mục tiêu này trong thời gian đã chọn (yêu cầu đóng góp trung bình <strong>{formatAmountInput(Math.ceil(reactiveSuggestions.targetAmount / (reactiveSuggestions.totalMonths * (groups.find(g => g.groupId === selectedGroupId)?.memberCount || 1))).toString())} VND/người/tháng</strong>).
                  <br />
                  <br />
                  Vui lòng chọn một trong các phương án điều chỉnh sau để phù hợp hơn:
                </Text>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleApplySuggestion('adjust_months')}
                    className="w-full p-4 rounded-xl border text-left transition-all hover:bg-gray-50 flex flex-col gap-1 hover:cursor-pointer"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                    }}
                  >
                    <span className="font-bold text-sm" style={{ color: colors.interactive.primary }}>
                      Phương án 1: Kéo dài thời gian tích lũy
                    </span>
                    <span className="text-xs" style={{ color: colors.text.secondary }}>
                      Giữ nguyên số tiền mục tiêu và tự động tăng thời gian lên <strong>{reactiveSuggestions.suggestedMonths} tháng</strong>.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplySuggestion('adjust_amount')}
                    className="w-full p-4 rounded-xl border text-left transition-all hover:bg-gray-50 flex flex-col gap-1 hover:cursor-pointer"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                    }}
                  >
                    <span className="font-bold text-sm" style={{ color: colors.text.primary }}>
                      Phương án 2: Giảm số tiền mục tiêu
                    </span>
                    <span className="text-xs" style={{ color: colors.text.secondary }}>
                      Giữ nguyên thời gian tích lũy <strong>{reactiveSuggestions.totalMonths} tháng</strong> và giảm mục tiêu xuống <strong>{formatAmountInput(reactiveSuggestions.suggestedAmount.toString())} VND</strong>.
                    </span>
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowReactiveWarning(false)}
                    className="w-full"
                  >
                    Hủy bỏ và tự chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
