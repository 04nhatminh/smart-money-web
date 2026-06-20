'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { useGroups } from '@/hooks/useGroups';
import { useUserIncome } from '@/hooks/useUserIncome';
import { ProjectAdvisorModeModal, ProjectAdvisorResultModal } from '.';
import { CreateGroupModal } from './CreateGroupModal';
import { CreateProjectRequest, ProjectAdvisorResponse } from '@/types/project.api';
import { GroupSummaryResponse } from '@/types/group.api';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose, MdLightbulb } from 'react-icons/md';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenUserIncomeModal?: () => void;
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
  onOpenUserIncomeModal,
  usedPriorities = [],
  maxProjectsReached = false,
  defaultType,
  defaultGroupId,
}) => {
  const { colors } = useTheme();
  const { isLoading: projectsLoading, createProject, projectAdvisor } = useProjects();
  const { listGroups, getGroupProjectSuggestions, createGroupProject, isLoading: groupsLoading } = useGroups();
  const { getUserIncome } = useUserIncome();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];

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

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'PERSONAL',
    priority: 'MEDIUM',
    targetAmount: '',
    currency: 'VND',
    deadline: today,
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
        deadline: today,
      });
      setSelectedGroupId(defaultGroupId || '');
      setTotalMonths('1');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, defaultType, defaultGroupId]);

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

  const handleSuggest = async () => {
    setError(null);
    if (!selectedGroupId) {
      setError('Please select a group first');
      return;
    }

    const payload: any = { groupId: selectedGroupId };
    if (suggestType === 'amount') {
      const amountVal = parseFormattedNumber(formData.targetAmount);
      if (!amountVal || amountVal <= 0) {
        setError('Please enter a target amount to suggest months');
        return;
      }
      payload.inputAmount = amountVal;
    } else {
      const monthsVal = parseInt(totalMonths);
      if (!monthsVal || monthsVal <= 0) {
        setError('Please enter months to suggest target amount');
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
        setError(res.error || 'Failed to get suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    const numericAmount = parseFormattedNumber(formData.targetAmount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    if (formData.type === 'GROUP') {
      if (!selectedGroupId) {
        setError('Please select a group for this project');
        return;
      }
      const months = parseInt(totalMonths);
      if (!months || months < 1 || months > 60) {
        setError('Total months must be between 1 and 60');
        return;
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
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onClose();
            onSuccess?.();
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
      setError(`You already have a project with ${formData.priority} priority. Each priority can only be used once.`);
      return;
    }

    if (!formData.deadline) {
      setError('Deadline is required');
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate <= new Date(today)) {
      setError('Deadline must be in the future');
      return;
    }

    // Check if user has set up user income
    try {
      const incomeResult = await getUserIncome();
      if (!incomeResult.success || !incomeResult.data) {
        setError('Please set up your user income information first');
        setTimeout(() => {
          onOpenUserIncomeModal?.();
        }, 500);
        return;
      }
    } catch (err) {
      console.error('Error checking user income:', err);
      setError('Please set up your user income information first');
      setTimeout(() => {
        onOpenUserIncomeModal?.();
      }, 500);
      return;
    }

    // All validations passed, open mode modal
    setIsModeModalOpen(true);
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
      const createData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        targetAmount: parseFormattedNumber(formData.targetAmount),
        currency: formData.currency.trim(),
        deadline: formData.deadline,
      };

      const result = await createProject(createData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsAdvisorResultModalOpen(false);
          onClose();
          onSuccess?.();
        }, 1500);
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
      const createData: CreateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        targetAmount: parseFormattedNumber(formData.targetAmount),
        currency: formData.currency.trim(),
        deadline: formData.deadline,
      };

      const result = await createProject(createData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to create project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  const showFormModal = !isModeModalOpen && !isAdvisorResultModalOpen;

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
                  Create {formData.type === 'PERSONAL' ? 'Personal' : 'Group'} Project
                </Heading>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg transition-colors hover:opacity-75"
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
                    <Text className="font-semibold">Project created successfully!</Text>
                  </div>
                )}

                {error && (
                  <div
                    className="p-4 rounded-lg text-center"
                    style={{
                      backgroundColor: `${colors.interactive.danger}20`,
                      color: colors.interactive.danger,
                    }}
                  >
                    <Text className="font-semibold text-sm">{error}</Text>
                  </div>
                )}

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Type <span style={{ color: colors.interactive.danger }}>*</span>
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
                            {tVal === 'PERSONAL' ? 'Personal' : 'Group'}
                          </span>
                          <span className="text-[11px]" style={{ color: colors.text.secondary }}>
                            {tVal === 'PERSONAL' ? 'Individual goal' : 'Shared project'}
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
                        Select Group <span style={{ color: colors.interactive.danger }}>*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreateGroupModalOpen(true)}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: colors.interactive.primary }}
                      >
                        + Create Group
                      </button>
                    </div>

                    {groups.length === 0 ? (
                      <div className="p-3 text-center border border-dashed rounded-lg" style={{ borderColor: colors.border.light }}>
                        <Text style={{ color: colors.text.secondary }} className="text-xs">
                          No locked admin groups available.
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
                    Project Name <span style={{ color: colors.interactive.danger }}>*</span>
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Summer Vacation Savings"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Add any additional details..."
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
                      Priority <span style={{ color: colors.interactive.danger }}>*</span>
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
                            <span className="font-semibold text-xs">{pVal}</span>
                            {isUsed ? (
                              <span className="text-[9px] font-semibold text-red-500 leading-tight">
                                Already used
                              </span>
                            ) : (
                              <span className="text-[10px]" style={{ color: colors.text.secondary }}>
                                Available
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
                    Target Amount <span style={{ color: colors.interactive.danger }}>*</span>
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
                      Deadline <span style={{ color: colors.interactive.danger }}>*</span>
                    </label>
                    <Input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      min={today}
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                      Total Months <span style={{ color: colors.interactive.danger }}>*</span>
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

                {/* Suggest block for Group Projects */}
                {formData.type === 'GROUP' && (
                  <div className="p-4 border rounded-xl space-y-3" style={{ borderColor: colors.border.light, backgroundColor: `${colors.interactive.primary}05` }}>
                    <div className="flex items-center gap-1.5">
                      <MdLightbulb className="text-yellow-500" size={18} />
                      <Heading level={4} className="text-xs font-bold uppercase" style={{ color: colors.text.primary }}>
                        Budget Suggestion
                      </Heading>
                    </div>
                    <Text className="text-xs" style={{ color: colors.text.secondary }}>
                      Get capacity-based suggestions for total amount or months based on active group members snapshots.
                    </Text>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSuggestType('amount')}
                        className="flex-1 py-1.5 rounded-lg border text-xs font-semibold"
                        style={{
                          borderColor: suggestType === 'amount' ? colors.interactive.primary : colors.border.light,
                          backgroundColor: suggestType === 'amount' ? `${colors.interactive.primary}10` : 'white',
                          color: suggestType === 'amount' ? colors.interactive.primary : colors.text.secondary,
                        }}
                      >
                        By target amount
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestType('months')}
                        className="flex-1 py-1.5 rounded-lg border text-xs font-semibold"
                        style={{
                          borderColor: suggestType === 'months' ? colors.interactive.primary : colors.border.light,
                          backgroundColor: suggestType === 'months' ? `${colors.interactive.primary}10` : 'white',
                          color: suggestType === 'months' ? colors.interactive.primary : colors.text.secondary,
                        }}
                      >
                        By months
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full text-xs font-bold py-1.5"
                      onClick={handleSuggest}
                      disabled={isLoading}
                    >
                      Suggest
                    </Button>
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
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};
