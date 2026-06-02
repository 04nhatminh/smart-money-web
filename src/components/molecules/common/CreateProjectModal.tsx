'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { useUserIncome } from '@/hooks/useUserIncome';
import { ProjectAdvisorModeModal, ProjectAdvisorResultModal } from '.';
import { CreateProjectRequest, ProjectAdvisorResponse } from '@/types/project.api';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose } from 'react-icons/md';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenUserIncomeModal?: () => void;
  usedPriorities?: string[];
  maxProjectsReached?: boolean;
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
}) => {
  const { colors } = useTheme();
  const { isLoading, createProject, projectAdvisor } = useProjects();
  const { getUserIncome } = useUserIncome();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  
  // New states for advisor flow
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isAdvisorResultModalOpen, setIsAdvisorResultModalOpen] = useState(false);
  const [advisorData, setAdvisorData] = useState<ProjectAdvisorResponse | null>(null);
  const [userIncomeData, setUserIncomeData] = useState<any>(null);
  const [useAiAdvisor, setUseAiAdvisor] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'PERSONAL',
    priority: 'MEDIUM',
    targetAmount: '',
    currency: 'VND',
    deadline: today,
  });

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      // Clear error when modal opens
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (usedPriorities.includes(formData.priority)) {
      setError(`You already have a project with ${formData.priority} priority. Each priority can only be used once.`);
      return;
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      setError('Please enter a valid target amount');
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
        // Open user income modal after a short delay
        setTimeout(() => {
          onOpenUserIncomeModal?.();
        }, 500);
        return;
      }
      // Store user income data for advisor
      setUserIncomeData(incomeResult.data);
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
      // Call project advisor API
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
      // Create project with adjusted values from advisor
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
        setFormData({
          name: '',
          description: '',
          type: 'PERSONAL',
          priority: 'MEDIUM',
          targetAmount: '',
          currency: 'VND',
          deadline: today,
        });

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
      // Create project with original user input
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
        setFormData({
          name: '',
          description: '',
          type: 'PERSONAL',
          priority: 'MEDIUM',
          targetAmount: '',
          currency: 'VND',
          deadline: today,
        });

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

  // Don't show form modal when advisor modals are open
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

      {showFormModal && (
      <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          pointerEvents: 'auto',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-lg shadow-2xl max-w-md w-full pointer-events-auto my-8"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>Create Project</Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors"
              style={{
                color: colors.text.secondary,
                backgroundColor: `${colors.interactive.primary}10`,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}20`}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${colors.interactive.primary}10`}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Success Message */}
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

            {/* Error Message */}
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

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Type <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  <option value="PERSONAL">Personal</option>
                  <option value="GROUP">Group</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Priority <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  <option value="LOW" disabled={usedPriorities.includes('LOW')}>
                    Low {usedPriorities.includes('LOW') ? '(Already used)' : ''}
                  </option>
                  <option value="MEDIUM" disabled={usedPriorities.includes('MEDIUM')}>
                    Medium {usedPriorities.includes('MEDIUM') ? '(Already used)' : ''}
                  </option>
                  <option value="HIGH" disabled={usedPriorities.includes('HIGH')}>
                    High {usedPriorities.includes('HIGH') ? '(Already used)' : ''}
                  </option>
                </select>
                {usedPriorities.length > 0 && (
                  <Text className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                    Available priorities: {['LOW', 'MEDIUM', 'HIGH'].filter(p => !usedPriorities.includes(p)).join(', ')}
                  </Text>
                )}
              </div>
            </div>

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

            {/* Deadline */}
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

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
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
