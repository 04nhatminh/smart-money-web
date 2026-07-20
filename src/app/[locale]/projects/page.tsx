'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Alert } from '@/components/atoms';
import {
  ProjectCard,
  CreateProjectModal,
  EditProjectModal,
  AddContributionModal,
  DeleteConfirmationModal,
  UserFinancialModal,
  GenerateBudgetModal,
  CreateGroupModal,
  GroupDetailModal,
  ProjectDetailModal,
} from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useProjects } from '@/hooks/useProjects';
import { useGroups } from '@/hooks/useGroups';
import { ProjectListItem, ProjectDetail } from '@/types/project.api';
import { GroupSummaryResponse } from '@/types/group.api';
import { MdAdd, MdFilterList, MdGroup, MdAssignment, MdLock, MdLockOpen } from 'react-icons/md';

export default function ProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations();
  const { isAuthenticated, isInitializing } = useAuth();
  const { colors } = useTheme();
  const { listProjects, getProject, deleteProject, isLoading: projectsLoading } = useProjects();
  const { listGroups, isLoading: groupsLoading } = useGroups();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'projects' | 'groups'>(
    tabParam === 'groups' ? 'groups' : 'projects'
  );

  // Sync tab param if it changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'groups') {
      setActiveTab('groups');
    } else if (tab === 'projects') {
      setActiveTab('projects');
    }
  }, [searchParams]);

  // Projects State
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [isUserFinancialModalOpen, setIsUserFinancialModalOpen] = useState(false);
  const [isGenerateBudgetModalOpen, setIsGenerateBudgetModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'FROZEN' | 'EXPIRED'>('ACTIVE');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailProject, setSelectedDetailProject] = useState<ProjectListItem | null>(null);

  // Groups State
  const [groups, setGroups] = useState<GroupSummaryResponse[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [defaultCreateType, setDefaultCreateType] = useState<'PERSONAL' | 'GROUP'>('PERSONAL');
  const [defaultCreateGroupId, setDefaultCreateGroupId] = useState<string | undefined>(undefined);

  // Check authentication
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isAuthenticated, isInitializing, router, locale]);

  // Load projects & groups
  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
      loadGroups();
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
        const errorMsg = result.error || '';
        if (errorMsg.toLowerCase().includes('failed to fetch')) {
          setError(t('errors.failedToFetch'));
        } else {
          setError(errorMsg || t('projects.loadFailed'));
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '';
      if (errorMsg.toLowerCase().includes('failed to fetch')) {
        setError(t('errors.failedToFetch'));
      } else {
        setError(errorMsg || t('projects.loadFailed'));
      }
    }
  };

  const loadGroups = async () => {
    try {
      const result = await listGroups();
      if (result.success && result.data) {
        setGroups(result.data);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
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
        setError(t('projects.loadDetailsFailed'));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('projects.loadSingleFailed');
      setError(errorMsg);
    }
  };

  const handleContributeClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsContributeModalOpen(true);
  };

  const handleViewDetails = (projectId: string) => {
    const proj = projects.find(p => p.projectId === projectId);
    if (proj) {
      setSelectedDetailProject(proj);
      setIsDetailModalOpen(true);
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
        setError(result.error || t('projects.deleteFailed'));
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('projects.deleteFailed');
      setError(errorMsg);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsGroupDetailModalOpen(true);
  };

  const handleCreateGroupProject = (groupId: string) => {
    setDefaultCreateType('GROUP');
    setDefaultCreateGroupId(groupId);
    setIsCreateModalOpen(true);
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
      abandoned: projects.filter(p => p.status === 'ABANDONED').length,
      frozen: projects.filter(p => p.status === 'FROZEN').length,
      expired: projects.filter(p => p.status === 'EXPIRED').length,
    };
  };

  const stats = getProjectStats();

  const canCreateProject = () => projects.filter(p => p.status === 'ACTIVE').length < 3;

  const getPrioritiesUsed = () => {
    const used = new Set<string>();
    projects.forEach(p => {
      if (p.status === 'ACTIVE') {
        used.add(p.priority);
      }
    });
    return used;
  };

  if (isInitializing) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Text>{t('common.loading')}</Text>
        </div>
      </SidebarLayout>
    );
  }

  const isLoading = projectsLoading || groupsLoading;

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Heading level={2}>
              {t('projects.title')}
            </Heading>
            <Text style={{ color: colors.text.secondary }} className="mt-1">
              Manage your personal savings projects and collaborative group projects.
            </Text>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'projects' ? (
              <>
                {!canCreateProject() && (
                  <div
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{
                      backgroundColor: '#F59E0B20',
                      color: '#F59E0B',
                    }}
                  >
                    {t('projects.maxLimitReached')}
                  </div>
                )}
                <Button
                  variant="primary"
                  onClick={() => {
                    setDefaultCreateType('PERSONAL');
                    setDefaultCreateGroupId(undefined);
                    setIsCreateModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                  disabled={!canCreateProject()}
                >
                  <MdAdd size={20} />
                  {t('projects.newProject')}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="flex items-center gap-2"
              >
                <MdAdd size={20} />
                New Group
              </Button>
            )}
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b" style={{ borderColor: colors.border.light }}>
          <button
            onClick={() => setActiveTab('projects')}
            className="px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 relative border-b-2 hover:cursor-pointer"
            style={{
              borderColor: activeTab === 'projects' ? colors.interactive.primary : 'transparent',
              color: activeTab === 'projects' ? colors.interactive.primary : colors.text.secondary,
            }}
          >
            <MdAssignment size={18} />
            Projects
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className="px-6 py-3 font-semibold text-sm transition-all flex items-center gap-2 relative border-b-2 hover:cursor-pointer"
            style={{
              borderColor: activeTab === 'groups' ? colors.interactive.primary : 'transparent',
              color: activeTab === 'groups' ? colors.interactive.primary : colors.text.secondary,
            }}
          >
            <MdGroup size={18} />
            Groups
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert message={error} type="error" onClose={() => setError(null)} />
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: t('projects.stats.total'), value: stats.total, color: colors.interactive.primary },
                { label: t('projects.stats.active'), value: stats.active, color: '#10B981' },
                { label: t('projects.stats.completed'), value: stats.completed, color: '#6B7280' },
                { label: t('projects.stats.abandoned'), value: stats.abandoned, color: '#EF4444' },
                { label: t('projects.stats.frozen'), value: stats.frozen, color: '#F59E0B' },
                { label: t('projects.stats.expired'), value: stats.expired, color: '#B91C1C' },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
                  style={{
                    borderColor: colors.border.light,
                    borderLeft: `4px solid ${stat.color}`,
                  }}
                >
                  <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: colors.text.tertiary }}>
                    {stat.label}
                  </Text>
                  <Heading
                    level={2}
                    className="mt-2 font-bold"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </Heading>
                </div>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatus('ALL')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:cursor-pointer flex items-center gap-2"
                style={{
                  backgroundColor: filterStatus === 'ALL' ? colors.interactive.primary : colors.background.secondary,
                  color: filterStatus === 'ALL' ? 'white' : colors.text.primary,
                }}
              >
                <MdFilterList size={16} />
                {t('projects.filter.all')}
              </button>
              <button
                onClick={() => setFilterStatus('ACTIVE')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:cursor-pointer"
                style={{
                  backgroundColor: filterStatus === 'ACTIVE' ? '#10B981' : colors.background.secondary,
                  color: filterStatus === 'ACTIVE' ? 'white' : colors.text.primary,
                }}
              >
                {t('projects.filter.active')}
              </button>
              <button
                onClick={() => setFilterStatus('COMPLETED')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:cursor-pointer"
                style={{
                  backgroundColor: filterStatus === 'COMPLETED' ? '#6B7280' : colors.background.secondary,
                  color: filterStatus === 'COMPLETED' ? 'white' : colors.text.primary,
                }}
              >
                {t('projects.filter.completed')}
              </button>
              <button
                onClick={() => setFilterStatus('ABANDONED')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:cursor-pointer"
                style={{
                  backgroundColor: filterStatus === 'ABANDONED' ? '#EF4444' : colors.background.secondary,
                  color: filterStatus === 'ABANDONED' ? 'white' : colors.text.primary,
                }}
              >
                {t('projects.filter.abandoned')}
              </button>
              <button
                onClick={() => setFilterStatus('FROZEN')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:cursor-pointer"
                style={{
                  backgroundColor: filterStatus === 'FROZEN' ? '#F59E0B' : colors.background.secondary,
                  color: filterStatus === 'FROZEN' ? 'white' : colors.text.primary,
                }}
              >
                {t('projects.filter.frozen')}
              </button>
              <button
                onClick={() => setFilterStatus('EXPIRED')}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:cursor-pointer"
                style={{
                  backgroundColor: filterStatus === 'EXPIRED' ? '#B91C1C' : colors.background.secondary,
                  color: filterStatus === 'EXPIRED' ? 'white' : colors.text.primary,
                }}
              >
                {t('projects.filter.expired')}
              </button>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div
                className="rounded-lg p-12 text-center border bg-white"
                style={{
                  borderColor: colors.border.light,
                }}
              >
                <Heading level={3} className="mb-2">
                  {t('projects.noProjects')}
                </Heading>
                <Text style={{ color: colors.text.tertiary }} className="mb-4">
                  {projects.length === 0 ? t('projects.createFirst') : (t('errors.noProjectsMatchingFilters') || t('projects.noProjectsMatch'))}
                </Text>
                {projects.length === 0 && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setDefaultCreateType('PERSONAL');
                      setDefaultCreateGroupId(undefined);
                      setIsCreateModalOpen(true);
                    }}
                  >
                    {t('projects.createFirstBtn')}
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
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            {groups.length === 0 ? (
              <div
                className="rounded-lg p-12 text-center border bg-white"
                style={{ borderColor: colors.border.light }}
              >
                <Heading level={3} style={{ color: colors.text.secondary }} className="mb-2">
                  No groups found
                </Heading>
                <Text style={{ color: colors.text.tertiary }} className="mb-4">
                  You are not a member of any active forming groups. Create one now to start saving together!
                </Text>
                <Button
                  variant="primary"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                >
                  Create Your First Group
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const isAdmin = group.adminId === group.groupId; // Wait, checking role instead
                  const isUserAdmin = group.myRole === 'ADMIN';
                  return (
                    <div
                      key={group.groupId}
                      onClick={() => handleGroupClick(group.groupId)}
                      className="border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-[180px]"
                      style={{ borderColor: colors.border.light }}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Heading level={4} className="m-0 line-clamp-1">
                            {group.name}
                          </Heading>
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border`} style={{
                            backgroundColor: group.status === 'LOCKED' ? '#F59E0B15' : '#10B98115',
                            borderColor: group.status === 'LOCKED' ? '#F59E0B20' : '#10B98120',
                            color: group.status === 'LOCKED' ? '#F59E0B' : '#10B981',
                          }}>
                            {group.status === 'LOCKED' ? <MdLock size={10} /> : <MdLockOpen size={10} />}
                            {group.status}
                          </span>
                        </div>
                        <Text className="text-xs mt-1.5 line-clamp-2">
                          {group.description || 'No description provided.'}
                        </Text>
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 mt-4" style={{ borderColor: colors.border.light }}>
                        <span className="text-xs px-2.5 py-1 rounded bg-gray-100 font-bold text-gray-600">
                          {group.memberCount} Joined
                        </span>
                        <span className={`text-xs font-bold uppercase ${isUserAdmin ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {group.myRole}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(budgetGenerated) => {
            loadProjects();
            if (!budgetGenerated) {
              setIsGenerateBudgetModalOpen(true);
            }
          }}
          onOpenUserFinancialModal={() => {
            setIsCreateModalOpen(false);
            setIsUserFinancialModalOpen(true);
          }}
          onOpenCreateGroupModal={() => {
            setIsCreateModalOpen(false);
            setIsCreateGroupModalOpen(true);
          }}
          usedPriorities={Array.from(getPrioritiesUsed())}
          maxProjectsReached={!canCreateProject()}
          defaultType={defaultCreateType}
          defaultGroupId={defaultCreateGroupId}
        />

        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          onSuccess={() => {
            loadGroups();
          }}
        />

        {selectedGroupId && (
          <GroupDetailModal
            isOpen={isGroupDetailModalOpen}
            groupId={selectedGroupId}
            onClose={() => {
              setIsGroupDetailModalOpen(false);
              setSelectedGroupId(null);
            }}
            onSuccess={() => {
              loadGroups();
              loadProjects();
            }}
            onCreateProject={handleCreateGroupProject}
          />
        )}

        <UserFinancialModal
          isOpen={isUserFinancialModalOpen}
          onClose={() => setIsUserFinancialModalOpen(false)}
          onSuccess={() => {
            setIsUserFinancialModalOpen(false);
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
          title={t('projects.deleteProjectTitle')}
          message={t('projects.deleteProjectConfirm')}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isLoading}
        />

        <GenerateBudgetModal
          isOpen={isGenerateBudgetModalOpen}
          onClose={() => setIsGenerateBudgetModalOpen(false)}
          onSuccess={loadProjects}
        />

        <ProjectDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedDetailProject(null);
          }}
          project={selectedDetailProject}
        />
      </div>
    </SidebarLayout>
  );
}
