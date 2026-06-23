'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { UpdateProjectRequest, ProjectDetail } from '@/types/project.api';
import { formatAmountInput, parseFormattedNumber } from '@/lib/format';
import { MdClose } from 'react-icons/md';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  project: ProjectDetail | null;
  usedPriorities?: string[];
}

type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH';
type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
const CURRENCY = 'VND'; // Fixed currency

interface FormData {
  name: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  targetAmount: string;
  currency: string;
  deadline: string;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project,
  usedPriorities = [],
}) => {
  const { colors } = useTheme();
  const { isLoading, updateProject } = useProjects();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    priority: 'MEDIUM',
    status: 'ACTIVE',
    targetAmount: '',
    currency: 'VND',
    deadline: today,
  });

  // Initialize form with project data when it changes
  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name,
        description: project.description || '',
        priority: project.priority,
        status: project.status,
        targetAmount: project.targetAmount.toString(),
        currency: project.currency,
        deadline: project.deadline.split('T')[0],
      });
      setError(null);
    }
  }, [project, isOpen]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
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

    if (!project) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    // Check if changing to a priority that's already used by another project
    if (formData.priority !== project.priority && usedPriorities.includes(formData.priority)) {
      setError(`This priority is already used by another project. Each priority can only be used once.`);
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

    try {
      const updateData: UpdateProjectRequest = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        targetAmount: parseFormattedNumber(formData.targetAmount),
        currency: formData.currency.trim(),
        deadline: formData.deadline,
      };

      const result = await updateProject(project.projectId, updateData);

      if (result.success) {
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen || !project) return null;

  return (
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
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto my-8 overflow-hidden"
          style={{ backgroundColor: colors.background.primary }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 rounded-t-2xl" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0" style={{ color: colors.text.primary }}>Edit Project</Heading>
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
                <Text className="font-semibold">Project updated successfully!</Text>
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

            {/* Priority and Status */}
            <div className="grid grid-cols-2 gap-4">
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
                  <option value="LOW" disabled={usedPriorities.includes('LOW') && formData.priority !== 'LOW'}>
                    Low {usedPriorities.includes('LOW') && formData.priority !== 'LOW' ? '(Already used)' : ''}
                  </option>
                  <option value="MEDIUM" disabled={usedPriorities.includes('MEDIUM') && formData.priority !== 'MEDIUM'}>
                    Medium {usedPriorities.includes('MEDIUM') && formData.priority !== 'MEDIUM' ? '(Already used)' : ''}
                  </option>
                  <option value="HIGH" disabled={usedPriorities.includes('HIGH') && formData.priority !== 'HIGH'}>
                    High {usedPriorities.includes('HIGH') && formData.priority !== 'HIGH' ? '(Already used)' : ''}
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                  Status <span style={{ color: colors.interactive.danger }}>*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                  style={{
                    borderColor: colors.border.light,
                    backgroundColor: colors.background.secondary,
                    color: colors.text.primary,
                  }}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
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
                {isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
