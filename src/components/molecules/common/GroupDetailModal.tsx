'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { GroupDetailResponse, GroupProjectDetailResponse, GroupMemberResponse } from '@/types/group.api';
import { formatAmountInput, parseFormattedNumber, formatNumber, formatPrice } from '@/lib/format';
import { MdClose, MdLock, MdLockOpen, MdPersonAdd, MdDelete, MdAddCircle, MdCheckCircle, MdCancel, MdRefresh, MdAutoAwesome } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { GenerateBudgetModal } from './GenerateBudgetModal';

interface GroupDetailModalProps {
  isOpen: boolean;
  groupId: string;
  onClose: () => void;
  onSuccess?: () => void;
  onCreateProject?: (groupId: string) => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  groupId,
  onClose,
  onSuccess,
  onCreateProject,
}) => {
  const { colors, colorScheme } = useTheme();
  const { user } = useAuth();
  const { listProjects } = useProjects();
  const t = useTranslations('groupDetail');
  const {
    getGroupDetail,
    lockGroup,
    unlockGroup,
    inviteGroupMember,
    removeGroupMember,
    deleteGroup,
    getGroupProjectDetail,
    joinGroupProject,
    dissolveGroupProject,
    updateAutoSponsorship,
    getPendingSponsorshipRequests,
    respondToSponsorshipRequest,
    isLoading: groupsLoading,
  } = useGroups();

  const [group, setGroup] = useState<GroupDetailResponse | null>(null);
  const [projectDetail, setProjectDetail] = useState<GroupProjectDetailResponse | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [usedPriorities, setUsedPriorities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [isGenerateBudgetOpen, setIsGenerateBudgetOpen] = useState(false);
  const [showRegenerateSuggest, setShowRegenerateSuggest] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<Record<string, boolean>>({});
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const [autoSponsorEnabled, setAutoSponsorEnabled] = useState(false);
  const [autoSponsorLimitType, setAutoSponsorLimitType] = useState<'MAX' | 'CUSTOM'>('MAX');
  const [autoSponsorLimit, setAutoSponsorLimit] = useState('');
  const [isSavingSponsorship, setIsSavingSponsorship] = useState(false);
  const [myPendingRequest, setMyPendingRequest] = useState<any | null>(null);
  const [savedSponsorshipText, setSavedSponsorshipText] = useState('');

  const [isProjectLoading, setIsProjectLoading] = useState(false);

  const isAdmin = group?.adminId === user?.id;
  const isForming = group?.status === 'FORMING';
  const isLocked = group?.status === 'LOCKED';

  useEffect(() => {
    if (isOpen && groupId) {
      loadDetails();
      loadUserProjects();
      document.body.style.overflow = 'hidden';
    } else {
      setGroup(null);
      setProjectDetail(null);
      setIsProjectLoading(false);
      setShowRegenerateSuggest(false);
      setIsGenerateBudgetOpen(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, groupId]);

  const loadUserProjects = async () => {
    try {
      const res = await listProjects();
      if (res.success && res.data) {
        const list = res.data.items || res.data.content || res.data || [];
        setUsedPriorities(
          list
            .filter((p: any) => p.status === 'ACTIVE')
            .map((p: any) => p.priority)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDetails = async () => {
    setLocalLoading(true);
    setIsProjectLoading(false);
    setError(null);
    try {
      const res = await getGroupDetail(groupId);
      if (res.success && res.data) {
        setGroup(res.data);
        
        const me = res.data.members.find((m: any) => m.userId === user?.id);
        if (me) {
          setAutoSponsorEnabled(me.autoSponsorEnabled || false);
          setAutoSponsorLimitType(me.autoSponsorLimit ? 'CUSTOM' : 'MAX');
          setAutoSponsorLimit(me.autoSponsorLimit ? formatAmountInput(me.autoSponsorLimit.toString()) : '');

          if (!me.autoSponsorEnabled) {
            setSavedSponsorshipText(t('configDisabled'));
          } else {
            setSavedSponsorshipText(me.autoSponsorLimit ? t('configCustom', { amount: formatAmountInput(me.autoSponsorLimit.toString()) }) : t('configMax'));
          }
        }

        if (res.data.groupProjectId) {
          setIsProjectLoading(true);
          try {
            const projRes = await getGroupProjectDetail(res.data.groupProjectId);
            if (projRes.success && projRes.data) {
              setProjectDetail(projRes.data);
            }

            const pendingRes = await getPendingSponsorshipRequests();
            if (pendingRes.success && pendingRes.data) {
              const match = pendingRes.data.find((r: any) => r.groupProjectId === res.data.groupProjectId);
              setMyPendingRequest(match || null);
            } else {
              setMyPendingRequest(null);
            }
          } finally {
            setIsProjectLoading(false);
          }
        } else {
          setProjectDetail(null);
          setMyPendingRequest(null);
        }
      } else {
        setError(res.error || 'Failed to load group details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSaveSponsorshipSettings = async () => {
    if (!group) return;
    setError(null);
    setSuccess(null);

    const me = group.members.find((m: any) => m.userId === user?.id);
    const capacity = me?.capacitySnapshot ?? 0;

    if (autoSponsorEnabled && autoSponsorLimitType === 'CUSTOM' && autoSponsorLimit) {
      const limitVal = parseFormattedNumber(autoSponsorLimit);
      if (limitVal > capacity) {
        const confirmSwitch = window.confirm(
          t('toast.sponsorLimitExceed', { limit: limitVal.toLocaleString(), capacity: capacity.toLocaleString() })
        );
        if (confirmSwitch) {
          setAutoSponsorLimitType('MAX');
          setAutoSponsorLimit('');
          setIsSavingSponsorship(true);
          try {
            const res = await updateAutoSponsorship(group.groupId, {
              enabled: true,
              limit: undefined,
            });
            if (res.success) {
              setSuccess(t('toast.sponsorshipUpdated'));
              loadDetails();
            } else {
              setError(res.error || t('toast.sponsorshipUpdateFailed'));
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
          } finally {
            setIsSavingSponsorship(false);
          }
        }
        return;
      }
    }

    setIsSavingSponsorship(true);
    try {
      const limitVal = autoSponsorLimitType === 'CUSTOM' && autoSponsorLimit
        ? parseFormattedNumber(autoSponsorLimit)
        : undefined;

      const res = await updateAutoSponsorship(group.groupId, {
        enabled: autoSponsorEnabled,
        limit: limitVal,
      });

      if (res.success) {
        setSuccess(t('toast.sponsorshipUpdated'));
        loadDetails();
      } else {
        setError(res.error || t('toast.sponsorshipUpdateFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setIsSavingSponsorship(false);
    }
  };

  const handleRespondSponsorship = async (agreed: boolean) => {
    if (!myPendingRequest) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await respondToSponsorshipRequest(myPendingRequest.requestId, { agreed });
      if (res.success) {
        setSuccess(agreed ? t('toast.sponsorAccepted') : t('toast.sponsorDeclined'));
        loadDetails();
      } else {
        setError(res.error || t('toast.sponsorResponseFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !group) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await inviteGroupMember(group.groupId, { email: inviteEmail.trim() });
      if (res.success) {
        setSuccess(t('toast.inviteSuccess'));
        setInviteEmail('');
        loadDetails();
      } else {
        setError(res.error || t('toast.inviteFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!group) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await removeGroupMember(group.groupId, userId);
      if (res.success) {
        setSuccess(t('toast.memberRemoved'));
        loadDetails();
      } else {
        setError(res.error || t('toast.removeFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResendInvite = async (email: string) => {
    if (!group || !email) return;
    setError(null);
    setSuccess(null);
    setResendingEmail(email);
    try {
      const res = await inviteGroupMember(group.groupId, { email });
      if (res.success) {
        setSuccess(t('toast.inviteResent', { email }));
        setSentEmails((prev) => ({ ...prev, [email]: true }));
        setTimeout(() => {
          setSentEmails((prev) => ({ ...prev, [email]: false }));
        }, 4000);
      } else {
        setError(res.error || t('toast.resendFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setResendingEmail(null);
    }
  };


  const handleLockGroup = async () => {
    if (!group) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await lockGroup(group.groupId);
      if (res.success) {
        setSuccess(t('toast.groupLocked'));
        loadDetails();
      } else {
        setError(res.error || t('toast.lockFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleUnlockGroup = async () => {
    if (!group) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await unlockGroup(group.groupId);
      if (res.success) {
        setSuccess(t('toast.groupUnlocked'));
        loadDetails();
      } else {
        setError(res.error || t('toast.unlockFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await deleteGroup(group.groupId);
      if (res.success) {
        setSuccess(t('toast.groupDeleted'));
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(res.error || t('toast.deleteFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
      setIsConfirmDeleteOpen(false);
    }
  };

  const handleJoinProject = async () => {
    if (!projectDetail) return;
    setError(null);
    setSuccess(null);

    if (usedPriorities.includes(selectedPriority)) {
      setError(t('toast.priorityInUse', { priority: selectedPriority }));
      return;
    }

    setLocalLoading(true);
    try {
      const res = await joinGroupProject(projectDetail.groupProjectId, { priority: selectedPriority });
      if (res.success) {
        setSuccess(t('toast.joinedProject'));
        loadDetails();
        onSuccess?.();
        setShowRegenerateSuggest(true);
      } else {
        setError(res.error || t('toast.joinFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
    }
  };

  const [isConfirmDissolveOpen, setIsConfirmDissolveOpen] = useState(false);

  const handleDissolveProject = async () => {
    if (!projectDetail) return;
    setError(null);
    setSuccess(null);
    setLocalLoading(true);
    try {
      const res = await dissolveGroupProject(projectDetail.groupProjectId);
      if (res.success) {
        onClose();
        onSuccess?.();
      } else {
        setError(res.error || t('toast.dissolveFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('toast.errorOccurred'));
    } finally {
      setLocalLoading(false);
      setIsConfirmDissolveOpen(false);
    }
  };

  const hasJoinedProject = () => {
    if (!projectDetail || !user) return false;
    return projectDetail.members.some(m => m.userId === user.id && m.personalProjectId !== null);
  };

  if (!isOpen) return null;

  const isLoading = groupsLoading || localLoading;

  return (
    <>
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 999,
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
        <div
          className="rounded-2xl shadow-2xl max-w-lg w-full my-8 overflow-hidden transition-all transform flex flex-col max-h-[90vh] border"
          style={{
            backgroundColor: colors.background.primary,
            borderColor: colors.border.light,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: colors.border.light }}>
            <div>
              <Heading level={3}>
                {group?.name || t('loadingGroup')}
              </Heading>
              {group?.description && (
                <Text className="text-sm mt-1">
                  {group.description}
                </Text>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
              style={{ color: colors.text.secondary }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {error && (
              <Alert message={error} type="error" onClose={() => setError(null)} />
            )}
            {success && (
              <Alert message={success} type="success" onClose={() => setSuccess(null)} />
            )}

            {group && (
              <>
                {/* Group Status */}
                <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                  <div>
                    <Text className="text-xs uppercase font-bold" style={{ color: colors.text.secondary }}>{t('statusLabel')}</Text>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.status === 'LOCKED' ? '#F59E0B' : group.status === 'DISSOLVED' ? '#EF4444' : '#10B981' }} />
                      <Text className="font-semibold">{t(`statusText.${group.status}`)}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && group.status !== 'DISSOLVED' && !group.groupProjectId && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setIsConfirmDeleteOpen(true)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5"
                      >
                        <MdDelete size={16} />
                        {t('deleteGroup')}
                      </Button>
                    )}
                    {isAdmin && isForming && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLockGroup}
                        disabled={isLoading}
                        className="flex items-center gap-1.5"
                      >
                        <MdLock size={16} />
                        {t('lockGroup')}
                      </Button>
                    )}
                    {isAdmin && isLocked && (!group.groupProjectId || (projectDetail && projectDetail.status === 'DISSOLVED')) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleUnlockGroup}
                        disabled={isLoading}
                        className="flex items-center gap-1.5"
                      >
                        <MdLockOpen size={16} />
                        {t('unlockGroup')}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Group Project Info */}
                {projectDetail && projectDetail.status !== 'DISSOLVED' ? (
                  <div className="border rounded-xl p-4 space-y-4" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <Heading level={4} style={{ color: colors.text.primary }}>{t('groupProjectTitle', { name: projectDetail.name })}</Heading>
                        <Text style={{ color: colors.text.secondary }} className="text-xs mt-0.5">{projectDetail.description}</Text>
                      </div>
                      {isAdmin && group?.status !== 'DISSOLVED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsConfirmDissolveOpen(true)}
                          disabled={isLoading}
                          style={{ color: '#EF4444', borderColor: '#EF444420', backgroundColor: '#EF444405' }}
                        >
                          {t('dissolveProject')}
                        </Button>
                      )}
                    </div>

                    {/* Progress */}
                    {(() => {
                      const requiredTarget = projectDetail.requiredTarget ?? projectDetail.targetAmount ?? 0;
                      const showOriginalGoal =
                        projectDetail.requiredTarget != null &&
                        projectDetail.requiredTarget !== projectDetail.targetAmount;

                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <Text style={{ color: colors.text.secondary }}>{t('totalSaved')}</Text>
                            <Text className="font-semibold" style={{ color: colors.text.primary }}>
                              {formatNumber(projectDetail.aggregateMoneySaved ?? 0)} / {formatNumber(requiredTarget)} {projectDetail.currency}
                            </Text>
                          </div>
                          <div className="w-full rounded-full h-3.5 overflow-hidden flex border" style={{ backgroundColor: colors.background.secondary, borderColor: colors.border.light }}>
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${Math.min(100, projectDetail.progressPercent)}%`,
                                backgroundColor: colors.interactive.primary,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            {showOriginalGoal ? (
                              <Text className="italic text-[11px]" style={{ color: colors.text.tertiary }}>
                                {t('originalGoalNote', { amount: formatNumber(projectDetail.targetAmount ?? 0), currency: projectDetail.currency })}
                              </Text>
                            ) : <div />}
                            <Text className="font-semibold" style={{ color: colors.interactive.primary }}>
                              {t('completed', { percent: (projectDetail.progressPercent ?? 0).toFixed(1) })}
                            </Text>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Join flow for current user (only when ACTIVE) */}
                    {!hasJoinedProject() && group?.status !== 'DISSOLVED' && projectDetail.status === 'ACTIVE' && (
                      <div className="p-4 border rounded-xl space-y-3" style={{ borderColor: colors.border.light, backgroundColor: `${colors.interactive.primary}08` }}>
                        <Heading level={4} className='pb-2'>{t('joinGroupProject')}</Heading>
                        <Text className="text-xs" style={{ color: colors.text.secondary }}>
                          {t('joinDescription')}
                        </Text>
                        <div className="flex gap-2">
                          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((pri) => {
                            const isUsed = usedPriorities.includes(pri);
                            const priLabel = t(`priorityLabel.${pri}`);
                            return (
                              <button
                                key={pri}
                                type="button"
                                disabled={isUsed}
                                onClick={() => setSelectedPriority(pri)}
                                className={`flex-1 py-2 px-3 rounded-lg border text-center text-xs font-semibold transition-all ${isUsed ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer'}`}
                                style={{
                                  borderColor: selectedPriority === pri ? colors.interactive.primary : colors.border.light,
                                  backgroundColor: selectedPriority === pri ? `${colors.interactive.primary}20` : colors.background.secondary,
                                  color: selectedPriority === pri ? colors.interactive.primary : colors.text.primary,
                                }}
                              >
                                {priLabel} {isUsed && t('priorityUsed')}
                              </button>
                            );
                          })}
                        </div>
                        <Button
                          variant="primary"
                          className="w-full text-sm"
                          onClick={handleJoinProject}
                          disabled={isLoading}
                        >
                          {t('acceptCreate')}
                        </Button>
                      </div>
                    )}

                    {/* Sponsorship survey pending notice & response actions */}
                    {group?.status !== 'DISSOLVED' && projectDetail.status === 'PENDING_SPONSORSHIP' && (
                      <div className="p-4 border rounded-xl space-y-3 animate-fade-in" style={{ borderColor: '#F59E0B40', backgroundColor: colorScheme === 'dark' ? '#F59E0B12' : '#FFFBEB' }}>
                        <div className="flex items-center gap-2 text-xs font-bold" style={{ color: colorScheme === 'dark' ? '#FBBF24' : '#92400E' }}>
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          {myPendingRequest ? t('pendingRequestTitle') : t('waitingSurvey')}
                        </div>
                        {myPendingRequest ? (
                          <div className="space-y-3">
                            <Text className="text-xs leading-relaxed" style={{ color: colors.text.secondary }}>
                              {t.rich('requestDescription', {
                                askedAmount: Number(myPendingRequest.askedAmount).toLocaleString(),
                                proposedShare: Number(myPendingRequest.proposedShare).toLocaleString(),
                                originalShare: Number(myPendingRequest.originalShare).toLocaleString(),
                              })}
                            </Text>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRespondSponsorship(false)}
                                disabled={localLoading}
                                style={{ color: '#EF4444', borderColor: '#EF444430', backgroundColor: 'transparent' }}
                              >
                                {t('declineBtn')}
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleRespondSponsorship(true)}
                                disabled={localLoading}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                              >
                                {t('agreeBtn')}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Text className="text-xs" style={{ color: colors.text.tertiary }}>
                            {t('waitingActivation')}
                          </Text>
                        )}
                      </div>
                    )}

                    {/* Sponsorship failed notice */}
                    {group?.status !== 'DISSOLVED' && projectDetail.status === 'SPONSORSHIP_FAILED' && (
                      <div className="p-4 border rounded-xl text-xs font-semibold" style={{ borderColor: '#EF444440', backgroundColor: '#EF444415', color: '#EF4444' }}>
                        {t('sponsorshipFailed')}
                      </div>
                    )}
                  </div>
                ) : isProjectLoading || (group.groupProjectId && !projectDetail) ? (
                  <div className="p-5 rounded-2xl border space-y-3 shadow-xs" style={{ backgroundColor: colors.surface.primary, borderColor: colors.border.light }}>
                    <div className="animate-pulse space-y-3">
                      <div className="h-5 rounded w-1/2 opacity-30" style={{ backgroundColor: colors.border.medium }}></div>
                      <div className="h-4 rounded w-3/4 opacity-30" style={{ backgroundColor: colors.border.medium }}></div>
                      <div className="h-10 rounded w-full opacity-30" style={{ backgroundColor: colors.border.medium }}></div>
                    </div>
                  </div>
                ) : (
                  isAdmin && isLocked && !group.groupProjectId && (
                    <div className="border border-dashed rounded-xl p-6 text-center space-y-3" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
                      <Text style={{ color: colors.text.secondary }} className="text-sm">
                        {t('noProjectYet')}
                      </Text>
                      <Button
                        variant="primary"
                        onClick={() => {
                          onClose();
                          onCreateProject?.(group.groupId);
                        }}
                      >
                        {t('createGroupProject')}
                      </Button>
                    </div>
                  )
                )}

                {/* Auto-Sponsorship Settings Panel */}
                {group.status !== 'DISSOLVED' && (
                  <div className="p-4 border rounded-xl space-y-3" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                    <div className="text-[11px] font-semibold px-2.5 py-1 rounded-md border inline-block mb-1" style={{ backgroundColor: `${colors.interactive.primary}15`, color: colors.interactive.primary, borderColor: `${colors.interactive.primary}30` }}>
                      {t('currentConfig', { config: savedSponsorshipText || t('configNone') })}
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1 min-w-0 pr-2">
                        <Heading level={4} className="text-sm font-bold flex items-center gap-1.5" style={{ color: colors.interactive.primary }}>
                          <MdAutoAwesome className="shrink-0" />
                          <span>{t('autoSponsorTitle')}</span>
                        </Heading>
                        <Text className="text-[11px] mt-0.5" style={{ color: colors.text.secondary }}>
                          {t('autoSponsorDesc')}
                        </Text>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={autoSponsorEnabled}
                          onChange={(e) => setAutoSponsorEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {autoSponsorEnabled && (
                      <div className="space-y-3 pt-2 border-t border-dashed" style={{ borderColor: colors.border.light }}>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: colors.text.primary }}>
                            <input
                              type="radio"
                              name="sponsorLimitType"
                              checked={autoSponsorLimitType === 'MAX'}
                              onChange={() => setAutoSponsorLimitType('MAX')}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            {t('maxCapacity')}
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer" style={{ color: colors.text.primary }}>
                            <input
                              type="radio"
                              name="sponsorLimitType"
                              checked={autoSponsorLimitType === 'CUSTOM'}
                              onChange={() => setAutoSponsorLimitType('CUSTOM')}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            {t('customLimit')}
                          </label>
                        </div>

                        {autoSponsorLimitType === 'CUSTOM' && (
                          <div className="max-w-xs">
                            <label className="block text-xs font-medium mb-1" style={{ color: colors.text.secondary }}>{t('customLimitLabel')}</label>
                            <Input
                              type="text"
                              value={autoSponsorLimit}
                              onChange={(e) => setAutoSponsorLimit(formatAmountInput(e.target.value))}
                              placeholder={t('customLimitPlaceholder')}
                              className="w-full text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleSaveSponsorshipSettings}
                        disabled={isSavingSponsorship}
                      >
                        {isSavingSponsorship ? t('saving') : t('saveConfig')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Member lineup & individual progress */}
                <div className="space-y-3">
                  <Heading level={4} className='pb-2'>{t('membersTitle')}</Heading>
                  <div className="divide-y border rounded-xl overflow-hidden" style={{ borderColor: colors.border.light }}>
                    {group.members.map((member) => {
                      const prog = projectDetail?.members.find(m => m.userId === member.userId);
                      const isCurrentUser = member.userId === user?.id;
                      return (
                        <div
                          key={member.userId}
                          className="p-4 flex items-center justify-between flex-wrap gap-4 transition-all"
                          style={{
                            backgroundColor: isCurrentUser ? `${colors.interactive.primary}12` : colors.surface.primary,
                            borderColor: colors.border.light,
                            borderLeft: isCurrentUser ? `4px solid ${colors.interactive.primary}` : 'none',
                            paddingLeft: isCurrentUser ? '12px' : '16px',
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Text className={`font-semibold ${isCurrentUser ? 'font-bold' : ''}`} style={{ color: isCurrentUser ? colors.interactive.primary : colors.text.primary }}>
                                {member.username || t('userFallback')} {isCurrentUser && t('you')}
                              </Text>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0" style={{
                                backgroundColor: member.role === 'ADMIN' ? `${colors.interactive.primary}20` : colors.background.secondary,
                                color: member.role === 'ADMIN' ? colors.interactive.primary : colors.text.secondary
                              }}>
                                {member.role === 'ADMIN' ? t('roleAdmin') : t('roleMember')}
                              </span>
                            </div>
                            {member.email && (
                              <div className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>{member.email}</div>
                            )}
                            <div className="flex gap-2 items-center mt-1 text-xs" style={{ color: colors.text.secondary }}>
                              {projectDetail ? (
                                prog?.projectStatus === 'ABANDONED' && (
                                  <span className="flex items-center gap-1 text-red-500 font-semibold uppercase">
                                    <MdCancel className="text-red-500" />
                                    {t('abandoned')}
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center gap-1">
                                  {member.inviteStatus === 'JOINED' && <MdCheckCircle className="text-green-500" />}
                                  {member.inviteStatus === 'INVITED' && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
                                  {member.inviteStatus === 'DECLINED' && <MdCancel className="text-red-500" />}
                                  {t(`inviteStatus.${member.inviteStatus}`)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Member Progress details if joined */}
                          {prog && prog.personalProjectId ? (
                            <div className="text-right">
                              <div className="text-[11px] font-bold mt-0.5" style={{ color: colors.interactive.primary }}>
                                {t('progress', { percent: (prog.progressPercent ?? 0).toFixed(0) })}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {isAdmin && isForming && member.inviteStatus === 'INVITED' && (
                                <>
                                  {sentEmails[member.email] ? (
                                    <span
                                      className="text-xs px-2.5 py-1 rounded-md border font-medium flex items-center gap-1"
                                      style={{
                                        backgroundColor: '#10B98115',
                                        color: '#10B981',
                                        borderColor: '#10B98140',
                                      }}
                                    >
                                      <MdCheckCircle className="w-3.5 h-3.5 text-green-500" />
                                      {t('sent')}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleResendInvite(member.email)}
                                      disabled={isLoading || resendingEmail === member.email}
                                      className={`text-xs px-2.5 py-1 rounded-md border transition-all font-medium flex items-center gap-1 ${
                                        resendingEmail === member.email ? 'opacity-50 cursor-not-allowed' : 'hover:cursor-pointer'
                                      }`}
                                      style={{
                                        backgroundColor: '#F59E0B15',
                                        color: '#F59E0B',
                                        borderColor: '#F59E0B40',
                                      }}
                                    >
                                      {resendingEmail === member.email ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-amber-500" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                          </svg>
                                          {t('resending')}
                                        </>
                                      ) : (
                                        t('resend')
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors hover:cursor-pointer"
                                    title={t('kickMemberTitle')}
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </>
                              )}
                              {isAdmin && isForming && member.inviteStatus === 'DECLINED' && (
                                <button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors hover:cursor-pointer"
                                  title={t('removeDeclinedTitle')}
                                >
                                  <MdDelete size={18} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invite section inside modal for admin when forming */}
                {isAdmin && isForming && (
                  <form onSubmit={handleInvite} className="border-t pt-4 shrink-0 space-y-2" style={{ borderColor: colors.border.light }}>
                    <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>{t('inviteNewMember')}</label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="member@example.com"
                        disabled={isLoading}
                        required
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={isLoading}
                        className="flex items-center gap-1.5 shrink-0"
                      >
                        <MdPersonAdd size={18} />
                        {t('inviteBtn')}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {isConfirmDeleteOpen && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsConfirmDeleteOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1011 }}>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col border"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-500">
                <MdDelete className="w-8 h-8" style={{ color: '#EF4444' }} />
                <Heading level={4} style={{ color: colors.text.primary }}>{t('deleteTitle')}</Heading>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                {t('deleteConfirm')}
              </Text>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  disabled={isLoading}
                >
                  {t('cancelBtn')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteGroup}
                  disabled={isLoading}
                  style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: 'white' }}
                >
                  {t('confirmDelete')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
      {isConfirmDissolveOpen && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsConfirmDissolveOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1011 }}>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col border"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-500">
                <MdCancel className="w-8 h-8" style={{ color: '#EF4444' }} />
                <Heading level={4} style={{ color: colors.text.primary }}>{t('dissolveTitle')}</Heading>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                {t('dissolveConfirm')}
              </Text>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmDissolveOpen(false)}
                  disabled={isLoading}
                >
                  {t('cancelBtn')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDissolveProject}
                  disabled={isLoading}
                  style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: 'white' }}
                >
                  {t('confirmDissolve')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {showRegenerateSuggest && (
        <>
          <div
            className="fixed inset-0 transition-opacity"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowRegenerateSuggest(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1011 }}>
            <div
              className="rounded-2xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col border"
              style={{
                backgroundColor: colors.background.primary,
                borderColor: colors.border.light,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-indigo-600">
                <MdAutoAwesome className="w-8 h-8" style={{ color: colors.interactive.primary }} />
                <Heading level={4} style={{ color: colors.text.primary }}>{t('recalcTitle')}</Heading>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                {t('recalcDesc')}
              </Text>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowRegenerateSuggest(false)}
                  disabled={isLoading}
                >
                  {t('laterBtn')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowRegenerateSuggest(false);
                    setIsGenerateBudgetOpen(true);
                  }}
                  disabled={isLoading}
                >
                  {t('recalcNow')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <GenerateBudgetModal
        isOpen={isGenerateBudgetOpen}
        onClose={() => setIsGenerateBudgetOpen(false)}
        onSuccess={() => {
          setIsGenerateBudgetOpen(false);
          loadDetails();
        }}
      />
    </>
  );
};
