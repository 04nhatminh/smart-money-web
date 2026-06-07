'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button } from '@/components/atoms';
import {
  ProjectCard,
  CreateProjectModal,
  EditProjectModal,
  AddContributionModal,
  DeleteConfirmationModal,
  UserIncomeModal,
} from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { ProjectListItem, ProjectDetail } from '@/types/project.api';
import { MdAdd, MdFilterList } from 'react-icons/md';

export default function ProjectsPage() {
  const router = useRouter();
  const locale = useLocale();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();
  const { listProjects, getProject, deleteProject, isLoading } = useProjects();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isUserIncomeModalOpen, setIsUserIncomeModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Check authentication
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Load projects
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated]);

  const loadProjects = async () => {
    try {
      setError(null);
      const result = await listProjects();

      if (result.success && result.data) {
        const projectList = result.data.items || result.data.content || result.data || [];
        setProjects(projectList);
      } else {
        setError(result.error || 'Failed to load projects');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load projects';
      setError(errorMsg);
    }
  };

  const handleEditClick = async (projectId: string) => {
    try {
      setError(null);
      const result = await getProject(projectId);
      if (result.success && result.data) {
        setSelectedProject(result.data);
        setIsEditModalOpen(true);
      } else {
        setError('Failed to load project details');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMsg);
    }
  };

  const handleContributeClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsContributeModalOpen(true);
  };

  const handleViewDetails = async (projectId: string) => {
    try {
      setError(null);
      const result = await getProject(projectId);
      if (result.success && result.data) {
        // Navigate to project details page
        router.push(`/${locale}/projects/${projectId}`);
      } else {
        setError('Failed to load project details');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load project';
      setError(errorMsg);
    }
  };

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      setError(null);
      const result = await deleteProject(projectToDelete);

      if (result.success) {
        setProjects(projects.filter(p => p.projectId !== projectToDelete));
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
      } else {
        setError(result.error || 'Failed to delete project');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMsg);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  // Filter projects based on status
  const filteredProjects = filterStatus === 'ALL'
    ? projects
    : projects.filter(p => p.status === filterStatus);

  const getProjectStats = () => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'ACTIVE').length,
      completed: projects.filter(p => p.status === 'COMPLETED').length,
      cancelled: projects.filter(p => p.status === 'CANCELLED').length,
    };
  };

  const stats = getProjectStats();

  // Helper functions for project limits
  const canCreateProject = () => projects.length < 3;

  const getPrioritiesUsed = () => {
    const used = new Set<string>();
    projects.forEach(p => used.add(p.priority));
    return used;
  };

  const getAvailablePriorities = () => {
    const used = getPrioritiesUsed();
    return ['LOW', 'MEDIUM', 'HIGH'].filter(p => !used.has(p));
  };

  if (isInitializing) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Text>Loading...</Text>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Heading level={2}>
              Projects
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="mt-1">
              Manage your saving projects (Max 3, one per priority)
            </Text>
          </div>
          <div className="flex items-center gap-3">
            {!canCreateProject() && (
              <div
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: '#F59E0B20',
                  color: '#F59E0B',
                }}
              >
                You've reached the limit of 3 projects
              </div>
            )}
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2"
              disabled={!canCreateProject()}
            >
              <MdAdd size={20} />
              New Project
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: colors.interactive.primary },
            { label: 'Active', value: stats.active, color: '#10B981' },
            { label: 'Completed', value: stats.completed, color: '#6B7280' },
            { label: 'Cancelled', value: stats.cancelled, color: '#EF4444' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border"
              style={{
                borderColor: colors.border.light,
                backgroundColor: colors.surface.primary,
              }}
            >
              <Text className="text-sm" style={{ color: colors.text.secondary }}>
                {stat.label}
              </Text>
              <Heading
                level={2}
                className="mt-1"
                style={{ color: stat.color }}
              >
                {stat.value}
              </Heading>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: '#EF444420',
              color: '#EF4444',
            }}
          >
            <Text className="font-semibold">{error}</Text>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('ALL')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            style={{
              backgroundColor: filterStatus === 'ALL' ? colors.interactive.primary : colors.background.secondary,
              color: filterStatus === 'ALL' ? 'white' : colors.text.primary,
            }}
          >
            <MdFilterList size={16} />
            All
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: filterStatus === 'ACTIVE' ? '#10B981' : colors.background.secondary,
              color: filterStatus === 'ACTIVE' ? 'white' : colors.text.primary,
            }}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: filterStatus === 'COMPLETED' ? '#6B7280' : colors.background.secondary,
              color: filterStatus === 'COMPLETED' ? 'white' : colors.text.primary,
            }}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('CANCELLED')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: filterStatus === 'CANCELLED' ? '#EF4444' : colors.background.secondary,
              color: filterStatus === 'CANCELLED' ? 'white' : colors.text.primary,
            }}
          >
            Cancelled
          </button>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div
            className="rounded-lg p-12 text-center border"
            style={{
              borderColor: colors.border.light,
              backgroundColor: colors.surface.primary,
            }}
          >
            <Heading level={3} style={{ color: colors.text.secondary }} className="mb-2">
              No projects found
            </Heading>
            <Text style={{ color: colors.text.tertiary }} className="mb-4">
              {projects.length === 0 ? "Create your first project to get started" : "No projects match the selected filter"}
            </Text>
            {projects.length === 0 && (
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Create First Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onContribute={handleContributeClick}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadProjects}
          onOpenUserIncomeModal={() => {
            setIsCreateModalOpen(false);
            setIsUserIncomeModalOpen(true);
          }}
          usedPriorities={Array.from(getPrioritiesUsed())}
          maxProjectsReached={!canCreateProject()}
        />

        <UserIncomeModal
          isOpen={isUserIncomeModalOpen}
          onClose={() => setIsUserIncomeModalOpen(false)}
          onSuccess={() => {
            setIsUserIncomeModalOpen(false);
            setIsCreateModalOpen(true);
          }}
        />

        {selectedProject && (
          <EditProjectModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedProject(null);
            }}
            onSuccess={loadProjects}
            project={selectedProject}
            usedPriorities={Array.from(getPrioritiesUsed())}
          />
        )}

        <AddContributionModal
          isOpen={isContributeModalOpen}
          onClose={() => {
            setIsContributeModalOpen(false);
            setSelectedProjectId(null);
          }}
          onSuccess={loadProjects}
          projectId={selectedProjectId}
          projectName={projects.find(p => p.projectId === selectedProjectId)?.name || null}
          currency={projects.find(p => p.projectId === selectedProjectId)?.currency || 'VND'}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Delete Project"
          message="Are you sure you want to delete this project? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isLoading}
        />
      </div>
    </SidebarLayout>
  );
}
