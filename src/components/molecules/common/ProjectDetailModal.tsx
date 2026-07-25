'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { ProjectListItem, ProjectContribution } from '@/types/project.api';
import { formatPrice } from '@/lib/format';
import { MdClose } from 'react-icons/md';
import { useTranslations, useLocale } from 'next-intl';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectListItem | null;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();
  const locale = useLocale();
  const { getProjectContributions } = useProjects();
  const [contributions, setContributions] = useState<ProjectContribution[]>([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(false);

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

  // Load contributions when modal opens
  useEffect(() => {
    const fetchContributions = async () => {
      if (isOpen && project?.projectId) {
        setIsLoadingContributions(true);
        try {
          const res = await getProjectContributions(project.projectId);
          if (res.success && res.data) {
            setContributions(res.data);
          }
        } catch (e) {
          console.error('Failed to load project contributions', e);
        } finally {
          setIsLoadingContributions(false);
        }
      }
    };

    fetchContributions();
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const progressPercent = Math.min(project.progressPercent, 100);

  const getStatusLabelColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#E6F4EA', text: '#137333' }; // green
      case 'COMPLETED':
        return { bg: '#E8EAED', text: '#3C4043' }; // grey
      case 'ABANDONED':
        return { bg: '#FCE8E6', text: '#C5221F' }; // red
      case 'FROZEN':
        return { bg: '#FEF7E0', text: '#B06000' }; // amber
      case 'EXPIRED':
        return { bg: '#FCE8E6', text: '#C5221F' }; // red
      default:
        return { bg: '#E8EAED', text: '#3C4043' };
    }
  };

  const getPriorityLabelColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return { bg: '#E8F0FE', text: '#1A73E8' }; // blue
      case 'MEDIUM':
        return { bg: '#FEF7E0', text: '#B06000' }; // amber
      case 'HIGH':
        return { bg: '#FCE8E6', text: '#C5221F' }; // red
      default:
        return { bg: '#E8EAED', text: '#3C4043' };
    }
  };

  const statusStyle = getStatusLabelColor(project.status);
  const priorityStyle = getPriorityLabelColor(project.priority);

  const formattedDeadline = (() => {
    if (!project.deadline) return '';
    const parts = project.deadline.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return project.deadline;
  })();

  const formatContributionDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
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
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 overflow-hidden flex flex-col"
          style={{ backgroundColor: colors.background.primary, maxHeight: '85vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 rounded-t-2xl" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Heading level={3} className="m-0">
              {t('projects.viewBtn')} {t('projects.personal').toLowerCase()}
            </Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
              style={{ color: colors.text.secondary }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Title & Badges */}
            <div className="space-y-2">
              <Heading level={2} className="m-0 pb-2" style={{ color: colors.text.primary }}>
                {project.name}
              </Heading>

              <div className="flex flex-wrap gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                  {t(`projects.status.${project.status}`)}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.text }}
                >
                  {t(`projects.priority.${project.priority}`)}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700"
                >
                  {project.type === 'PERSONAL' ? t('projects.personal') : t('projects.group')}
                </span>
              </div>
            </div>

            {/* Target & Contribution Progress */}
            <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
              <div className="flex justify-between items-center text-sm">
                <Text className="font-medium" style={{ color: colors.text.secondary }}>
                  {t('projects.contributedTarget')}
                </Text>
                <Text className="font-semibold" style={{ color: colors.text.primary }}>
                  {formatPrice(project.totalContributed)} / {formatPrice(project.targetAmount)}
                </Text>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: colors.interactive.primary,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <Text style={{ color: colors.text.tertiary }}>
                  {t('projects.reached', { percent: progressPercent.toFixed(1) })}
                </Text>
                <Text style={{ color: colors.text.primary }} className="font-medium">
                  {t('projects.remaining', { amount: formatPrice(project.targetAmount - project.totalContributed) })}
                </Text>
              </div>
            </div>

            {/* General Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {project.status !== 'COMPLETED' && (
                <div className="space-y-1">
                  <Text style={{ color: colors.text.tertiary }} className="text-xs">
                    {t('projects.deadline')}
                  </Text>
                  <Text style={{ color: colors.text.primary }} className="font-semibold">
                    {formattedDeadline || '-'}
                  </Text>
                </div>
              )}
              <div className="space-y-1">
                <Text style={{ color: colors.text.tertiary }} className="text-xs">
                  {t('projects.createModal.typeLabel')}
                </Text>
                <Text style={{ color: colors.text.primary }} className="font-semibold">
                  {project.type === 'PERSONAL' ? t('projects.createModal.personalType') : t('projects.createModal.groupType')}
                </Text>
              </div>
            </div>

            {/* Contributions History List */}
            <div className="space-y-3">
              <Heading level={4} className="m-0 pb-2" style={{ color: colors.text.primary }}>
                Lịch sử đóng góp
              </Heading>

              {isLoadingContributions ? (
                <div className="py-8 text-center">
                  <Text style={{ color: colors.text.secondary }}>{t('common.loading')}</Text>
                </div>
              ) : contributions.length === 0 ? (
                <div className="py-6 text-center border border-dashed rounded-xl" style={{ borderColor: colors.border.light }}>
                  <Text style={{ color: colors.text.secondary }} className="text-sm">
                    Chưa có lượt đóng góp nào cho kế hoạch này.
                  </Text>
                </div>
              ) : (
                <div className="border rounded-xl divide-y overflow-hidden max-h-[200px] overflow-y-auto" style={{ borderColor: colors.border.light }}>
                  {contributions.map((c) => (
                    <div key={c.id} className="p-3 flex justify-between items-center text-sm hover:bg-gray-50 transition-colors">
                      <div className="space-y-0.5">
                        <Text className="font-medium" style={{ color: colors.text.primary }}>
                          {c.userName || t('projects.personal')}
                        </Text>
                        <Text style={{ color: colors.text.tertiary }} className="text-xs">
                          {formatContributionDate(c.contributedAt)}
                        </Text>
                      </div>
                      <Text className="font-semibold text-emerald-600">
                        +{formatPrice(c.amount)}
                      </Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end sticky bottom-0 rounded-b-2xl" style={{ borderColor: colors.border.light, backgroundColor: colors.background.primary }}>
            <Button variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
