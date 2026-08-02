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
import { formatAmountInput, parseFormattedNumber, formatPrice, getDeadlineFromMonths, formatDateToInput } from '@/lib/format';
import { MdClose, MdLightbulb, MdAutoAwesome, MdGroup, MdKeyboardArrowDown, MdCheckCircle, MdBlock } from 'react-icons/md';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (budgetGenerated?: boolean) => void;
  onOpenUserFinancialModal?: () => void;
  onOpenCreateGroupModal?: () => void;
  usedPriorities?: string[];
  maxProjectsReached?: boolean;
  defaultType?: 'PERSONAL' | 'GROUP';
  defaultGroupId?: string;
  initialGroups?: GroupSummaryResponse[];
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
  onOpenCreateGroupModal,
  usedPriorities = [],
  maxProjectsReached = false,
  defaultType,
  defaultGroupId,
  initialGroups,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
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
  const [isFetchingGroups, setIsFetchingGroups] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [totalMonths, setTotalMonths] = useState('1');
  const [deadlineMonths, setDeadlineMonths] = useState('1');
  const [suggestType, setSuggestType] = useState<'amount' | 'months'>('amount');

  const handleDeadlineMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDeadlineMonths(val);
    const num = Math.max(1, Number(val) || 1);
    setFormData((prev) => ({
      ...prev,
      deadline: getDeadlineFromMonths(num),
    }));
  };
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const [reactiveSuggestions, setReactiveSuggestions] = useState<{
    totalCapacity: number;
    suggestedMonths: number;
    suggestedAmount: number;
    targetAmount: number;
    totalMonths: number;
  } | null>(null);
  const [showReactiveWarning, setShowReactiveWarning] = useState(false);

  const [simulationData, setSimulationData] = useState<any>(null);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
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

  const filterAdminLockedGroups = (list: GroupSummaryResponse[]) => {
    return list.filter((g) => g.status === 'LOCKED' && g.myRole === 'ADMIN');
  };

  const loadGroups = async () => {
    setIsFetchingGroups(true);
    try {
      const res = await listGroups();
      if (res.success && res.data) {
        const filtered = filterAdminLockedGroups(res.data);
        setGroups(filtered);
        const available = filtered.filter((g) => !g.groupProjectId);
        if (available.length > 0) {
          setSelectedGroupId((prev) => prev || available[0].groupId);
        } else if (filtered.length > 0) {
          setSelectedGroupId((prev) => prev || filtered[0].groupId);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingGroups(false);
    }
  };

  // Populate groups instantly from initialGroups or fetch if needed when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialGroups && initialGroups.length > 0) {
        const filtered = filterAdminLockedGroups(initialGroups);
        setGroups(filtered);
        const available = filtered.filter((g) => !g.groupProjectId);
        if (available.length > 0) {
          setSelectedGroupId(defaultGroupId || available[0].groupId);
        } else if (filtered.length > 0) {
          setSelectedGroupId(defaultGroupId || filtered[0].groupId);
        }
      } else if (formData.type === 'GROUP') {
        loadGroups();
      }
    }
  }, [isOpen, initialGroups, formData.type]);

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

  const performCreateGroupProject = async (amount: number, months: number) => {
    try {
      const res = await createGroupProject({
        groupId: selectedGroupId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        targetAmount: amount,
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
  };

  const handleConfirmCreateGroupProject = async () => {
    setShowSimulationModal(false);
    const numericAmount = parseFormattedNumber(formData.targetAmount);
    const months = parseInt(totalMonths, 10) || 1;
    await performCreateGroupProject(numericAmount, months);
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
      const targetGroup = groups.find(g => g.groupId === selectedGroupId);
      if (targetGroup?.groupProjectId) {
        setError('Một nhóm chỉ gắn liền với 1 dự án. Vui lòng nhân bản nhóm để tạo dự án mới.');
        return;
      }
      const months = parseInt(totalMonths);
      if (!months || months < 1 || months > 60) {
        setError(t('projects.createModal.errors.monthsRange'));
        return;
      }

      // Group Project Capacity Check via Sponsorship Simulation
      try {
        const suggestionsRes = await getGroupProjectSuggestions({
          groupId: selectedGroupId,
          inputMonths: months,
          inputAmount: numericAmount,
        });
        if (suggestionsRes.success && suggestionsRes.data) {
          const data = suggestionsRes.data;

          if (data.totalDeficit && data.totalDeficit > 0) {
            if (data.isFeasible) {
              // Group can afford via sponsorship! Show simulation modal
              setSimulationData(data);
              setShowSimulationModal(true);
              return;
            } else {
              // Not feasible. Show the adjustment warning modal
              const totalCapacity = data.totalCapacity;
              const suggestedMonthsVal = data.suggestedMonths || Math.ceil(numericAmount / totalCapacity);
              const suggestedAmountVal = data.suggestedAmount || (totalCapacity * months);

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

      // Group Project direct creation (no deficits detected)
      await performCreateGroupProject(numericAmount, months);
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
        d.setMonth(d.getMonth() + advisorData.numberOfMonths);
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

  const showFormModal = !isModeModalOpen && !isAdvisorResultModalOpen && !showDateGateOptions && !success && !isGenerateBudgetOpen;

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
              <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                        onClick={() => {
                          if (onOpenCreateGroupModal) {
                            onOpenCreateGroupModal();
                          } else {
                            setIsCreateGroupModalOpen(true);
                          }
                        }}
                        className="text-xs font-semibold hover:underline cursor-pointer hover:cursor-pointer"
                        style={{ color: colors.interactive.primary }}
                      >
                        {t('projects.createModal.createGroup')}
                      </button>
                    </div>

                    {isFetchingGroups && groups.length === 0 ? (
                      <div className="w-full h-10 px-3 py-2 rounded-lg border flex items-center gap-2 animate-pulse" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                        <span className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        <span className="text-xs text-gray-500 font-medium">Đang tải danh sách nhóm...</span>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="p-3 text-center border border-dashed rounded-lg" style={{ borderColor: colors.border.light }}>
                        <Text style={{ color: colors.text.secondary }} className="text-xs">
                          {t('projects.createModal.noGroups')}
                        </Text>
                      </div>
                    ) : (
                      <div className="relative" ref={dropdownRef}>
                        {/* Custom Select Trigger Button */}
                        <button
                          type="button"
                          onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                          className="w-full px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs hover:border-indigo-400 cursor-pointer"
                          style={{
                            borderColor: isGroupDropdownOpen ? colors.interactive.primary : colors.border.light,
                            backgroundColor: colors.background.secondary,
                            color: colors.text.primary,
                          }}
                        >
                          {(() => {
                            const sel = groups.find((g) => g.groupId === selectedGroupId);
                            if (!sel) {
                              return <span className="text-sm text-gray-400 font-medium">Chọn nhóm...</span>;
                            }
                            return (
                              <div className="flex items-center gap-2.5 overflow-hidden text-left">
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                  <MdGroup size={16} />
                                </div>
                                <span className="font-semibold text-sm truncate">{sel.name}</span>
                                {sel.groupProjectId && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                    Đã có dự án
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <MdKeyboardArrowDown
                            size={20}
                            className={`text-gray-400 transition-transform duration-200 shrink-0 ${isGroupDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                              }`}
                          />
                        </button>

                        {/* Floating Custom Dropdown Menu */}
                        {isGroupDropdownOpen && (
                          <div
                            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 p-1.5 space-y-1 z-50 max-h-60 overflow-y-auto"
                            style={{ borderColor: colors.border.light }}
                          >
                            {groups.map((g) => {
                              const isSelected = g.groupId === selectedGroupId;
                              const isDisabled = !!g.groupProjectId;

                              return (
                                <div
                                  key={g.groupId}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      setSelectedGroupId(g.groupId);
                                      setIsGroupDropdownOpen(false);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${isDisabled
                                    ? 'opacity-55 bg-gray-50/80 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-indigo-50/90 text-indigo-900 font-semibold border border-indigo-200/60 cursor-pointer'
                                      : 'hover:bg-gray-50 cursor-pointer text-gray-800'
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${isDisabled
                                        ? 'bg-gray-200 text-gray-500'
                                        : isSelected
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-indigo-50 text-indigo-600'
                                        }`}
                                    >
                                      <MdGroup size={15} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold truncate leading-tight">{g.name}</p>
                                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                        {g.memberCount} thành viên {g.description ? `• ${g.description}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {isDisabled ? (
                                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                        <MdBlock size={11} />
                                        <span>Đã có dự án (Cần clone)</span>
                                      </div>
                                    ) : isSelected ? (
                                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-600">
                                        <MdCheckCircle size={15} />
                                        <span>Đã chọn</span>
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Khả dụng
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {groups.every((g) => !!g.groupProjectId) && (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs font-medium mt-2 flex items-start gap-2">
                            <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                            <span>
                              Tất cả các nhóm bạn quản lý đều đã từng tạo dự án. Vui lòng chọn <strong>+ Create Group</strong> ở trên để nhân bản (clone) nhóm mới trước khi tạo dự án.
                            </span>
                          </div>
                        )}
                      </div>
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

                {/* Personal Project: Deadline Months (matching mobile UX) */}
                {formData.type === 'PERSONAL' ? (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                      {locale === 'vi' ? 'Số tháng tích lũy' : 'Duration (Months)'} <span style={{ color: colors.interactive.danger }}>*</span>
                    </label>
                    <Input
                      type="number"
                      name="deadlineMonths"
                      value={deadlineMonths}
                      onChange={handleDeadlineMonthsChange}
                      disabled={isLoading}
                      min={1}
                      max={60}
                      placeholder={locale === 'vi' ? 'Ví dụ: 2' : 'e.g. 2'}
                      required
                    />
                    {formData.deadline && (
                      <p className="text-xs mt-1 font-medium pt-1" style={{ color: colors.text.secondary }}>
                        {locale === 'vi'
                          ? `Hạn chót dự kiến: ${formatDateToInput(formData.deadline)} (${deadlineMonths || 1} tháng)`
                          : `Estimated deadline: ${formatDateToInput(formData.deadline)} (${deadlineMonths || 1} month(s))`}
                      </p>
                    )}
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
              className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full my-8 p-8 text-center space-y-6 pointer-events-auto"
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowReactiveWarning(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1020 }}>
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

      {/* Sponsorship Simulation Modal */}
      {showSimulationModal && simulationData && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowSimulationModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1020 }}>
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 overflow-hidden pointer-events-auto"
              style={{ backgroundColor: colors.background.primary }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light }}>
                <Heading level={3} className="m-0 text-xl font-bold flex items-center gap-2" style={{ color: colors.interactive.primary }}>
                  <MdAutoAwesome className="w-6 h-6 animate-pulse" />
                  Mô Phỏng Gánh Vác Đóng Góp
                </Heading>
                <button
                  onClick={() => setShowSimulationModal(false)}
                  className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
                  style={{ color: colors.text.secondary }}
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <Text className="text-sm" style={{ color: colors.text.secondary }}>
                  Một số thành viên trong nhóm không đủ khả năng tài chính để đóng góp đều nhau. Tuy nhiên, các thành viên khác có đủ khả năng bù đắp phần thiếu hụt này.
                </Text>

                <div className="p-4 border rounded-xl bg-emerald-50/30 text-emerald-800 text-xs font-medium space-y-1.5" style={{ borderColor: '#10B98130' }}>
                  <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-700">
                    ✓ Nhóm Có Đủ Khả Năng Gánh Vác
                  </div>
                  <p className="leading-relaxed">
                    Mức thu nhập và tiết kiệm hiện tại của nhóm đủ khả năng bù đắp cho các thành viên còn thiếu hụt.
                  </p>
                </div>

                {(() => {
                  const sims = simulationData.memberSimulations || [];
                  const pendingCount = sims.filter((sim: any) => {
                    const diff = sim.proposedShare - sim.originalShare;
                    if (diff <= 0) return false;
                    const autoSponsor = sim.autoSponsorEnabled;
                    const withinLimit = !sim.autoSponsorLimit || diff <= sim.autoSponsorLimit;
                    return !(autoSponsor && withinLimit);
                  }).length;

                  return (
                    <div className="p-4 border rounded-xl bg-amber-50/30 text-amber-900 text-xs space-y-1.5" style={{ borderColor: '#F59E0B30' }}>
                      <div className="font-bold text-sm text-amber-800">
                        Quy trình phê duyệt dự kiến:
                      </div>
                      {pendingCount > 0 ? (
                        <p className="leading-relaxed">
                          Hệ thống sẽ gửi <strong>yêu cầu khảo sát đồng ý hỗ trợ đóng góp giúp</strong> đến <strong>{pendingCount} thành viên</strong> gánh vác. Dự án sẽ ở trạng thái <strong>Chờ Khảo Sát</strong> và kích hoạt ngay sau khi họ đồng ý.
                        </p>
                      ) : (
                        <p className="leading-relaxed">
                          Tất cả thành viên gánh vác đều đã kích hoạt tính năng Tự động hỗ trợ đồng đội trong hạn mức. Dự án sẽ được <strong>Kích hoạt Tự động (ACTIVE)</strong> ngay lập tức!
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: colors.border.light }}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowSimulationModal(false)}
                    className="flex-1"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleConfirmCreateGroupProject}
                    className="flex-1"
                  >
                    Xác nhận & Khởi tạo
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
