'use client';

import React from 'react';
import { Text, Button } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { ProjectListItem, ProjectStatus, ProjectPriority } from '@/types/project.api';
import { formatVietnamsePrice } from '@/lib/format';
import { MdEdit, MdDelete, MdCheckCircle } from 'react-icons/md';
import { useTranslations } from 'next-intl';

interface ProjectCardProps {
  project: ProjectListItem;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onContribute?: (projectId: string) => void;
  onViewDetails?: (projectId: string) => void;
}

const getStatusColor = (status: ProjectStatus): string => {
  const colors: { [key in ProjectStatus]: string } = {
    ACTIVE: '#10B981', // Green
    COMPLETED: '#6B7280', // Gray
    ABANDONED: '#EF4444', // Red
  };
  return colors[status] || '#6B7280';
};

const getPriorityColor = (priority: ProjectPriority): string => {
  const colors: { [key in ProjectPriority]: string } = {
    LOW: '#3B82F6', // Blue
    MEDIUM: '#F59E0B', // Amber
    HIGH: '#EF4444', // Red
  };
  return colors[priority] || '#6B7280';
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onContribute,
  onViewDetails,
}) => {
  const { colors } = useTheme();
  const t = useTranslations();

  const progressPercent = Math.min(project.progressPercent, 100);
  const statusColor = getStatusColor(project.status);
  const priorityColor = getPriorityColor(project.priority);
  const daysLeft = project.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div
      className="rounded-lg p-4 border hover:shadow-lg transition-shadow"
      style={{
        borderColor: colors.border.light,
        backgroundColor: colors.surface.primary,
      }}
    >
      {/* Header with Title and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Text
            className="font-semibold text-base mb-1"
            style={{ color: colors.text.primary }}
          >
            {project.name}
          </Text>
          <Text
            className="text-xs"
            style={{ color: colors.text.tertiary }}
          >
            {project.type === 'PERSONAL' ? t('projects.personal') : t('projects.group')} • {project.currency}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusColor + '20', color: statusColor }}
          >
            {t(`projects.status.${project.status}`)}
          </div>
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: priorityColor + '20', color: priorityColor }}
          >
            {t(`projects.priority.${project.priority}`)}
          </div>
        </div>
      </div>

      {/* Target Amount */}
      <div className="mb-3 pb-3 border-b" style={{ borderColor: colors.border.light }}>
        <div className="flex justify-between items-baseline mb-1">
          <Text className="text-sm" style={{ color: colors.text.secondary }}>
            {t('projects.targetContributed')}
          </Text>
          <Text className="font-semibold text-sm" style={{ color: colors.text.primary }}>
            {formatVietnamsePrice(project.totalContributed)} / {formatVietnamsePrice(project.targetAmount)}
          </Text>
        </div>

        {/* Progress Bar */}
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: colors.border.light }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: statusColor,
            }}
          />
        </div>

        {/* Progress Info */}
        <div className="flex justify-between items-center mt-1">
          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
            {t('projects.reached', { percent: progressPercent.toFixed(1) })}
          </Text>
          <Text className="text-xs font-medium" style={{ color: colors.text.primary }}>
            {t('projects.remaining', { amount: formatVietnamsePrice(project.targetAmount - project.totalContributed) })}
          </Text>
        </div>
      </div>

      {/* Deadline Info */}
      {project.deadline && (
        <div className="mb-3 flex items-center justify-between">
          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
            {t('projects.deadline')}
          </Text>
          <Text
            className="text-xs font-medium"
            style={{
              color: daysLeft < 7 ? '#EF4444' : daysLeft < 30 ? '#F59E0B' : colors.text.primary
            }}
          >
            {daysLeft > 0 ? t('projects.daysLeft', { days: daysLeft }) : daysLeft === 0 ? t('projects.today') : t('projects.expired')}
          </Text>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(project.projectId)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
            style={{
              backgroundColor: colors.background.primary + '20',
              color: colors.background.primary,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = colors.background.secondary + '30';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = colors.background.primary + '20';
            }}
          >
            <MdCheckCircle size={16} /> {t('projects.viewBtn')}
          </button>
        )}
        {onContribute && project.status === 'ACTIVE' && (
          <button
            onClick={() => onContribute(project.projectId)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: colors.background.primary,
              color: 'white',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {t('projects.contributeBtn')}
          </button>
        )}
        <button
          onClick={() => onEdit(project.projectId)}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:cursor-pointer"
          style={{
            backgroundColor: colors.background.primary + '15',
            color: colors.text.primary,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = colors.background.secondary + '25';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = colors.background.primary + '15';
          }}
          title={t('common.edit')}
        >
          <MdEdit size={18} />
        </button>
        <button
          onClick={() => onDelete(project.projectId)}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:cursor-pointer"
          style={{
            backgroundColor: '#EF4444' + '15',
            color: '#EF4444',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#EF4444' + '25';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#EF4444' + '15';
          }}
          title={t('common.delete')}
        >
          <MdDelete size={18} />
        </button>
      </div>
    </div>
  );
};
