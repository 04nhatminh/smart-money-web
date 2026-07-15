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
  const { colors } = useTheme();
  const { user } = useAuth();
  const { listProjects } = useProjects();
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
  const [savedSponsorshipText, setSavedSponsorshipText] = useState('Chưa cấu hình');

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
            setSavedSponsorshipText('Không tự động hỗ trợ');
          } else {
            setSavedSponsorshipText(me.autoSponsorLimit ? `Tự động hỗ trợ (Tối đa ${formatAmountInput(me.autoSponsorLimit.toString())} VND/tháng)` : 'Tự động hỗ trợ (Tối đa khả năng)');
          }
        }

        if (res.data.groupProjectId) {
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
        setSuccess('Cập nhật cấu hình tự động hỗ trợ thành công!');
        loadDetails();
      } else {
        setError(res.error || 'Không thể cập nhật cấu hình');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
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
        setSuccess(agreed ? 'Bạn đã đồng ý gánh vác đóng góp giúp đồng đội!' : 'Bạn đã từ chối gánh vác đóng góp.');
        loadDetails();
      } else {
        setError(res.error || 'Có lỗi xảy ra khi phản hồi');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
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
        setSuccess('Invitation sent successfully!');
        setInviteEmail('');
        loadDetails();
      } else {
        setError(res.error || 'Failed to invite member');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        setSuccess('Member removed successfully!');
        loadDetails();
      } else {
        setError(res.error || 'Failed to remove member');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        setSuccess(`Invitation resent to ${email}!`);
        setSentEmails((prev) => ({ ...prev, [email]: true }));
        setTimeout(() => {
          setSentEmails((prev) => ({ ...prev, [email]: false }));
        }, 4000);
      } else {
        setError(res.error || 'Failed to resend invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        setSuccess('Group locked successfully!');
        loadDetails();
      } else {
        setError(res.error || 'Failed to lock group. Verify you have at least one JOINED member.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        setSuccess('Group unlocked successfully!');
        loadDetails();
      } else {
        setError(res.error || 'Failed to unlock group.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        setSuccess('Group deleted successfully!');
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 1500);
      } else {
        setError(res.error || 'Failed to delete group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
      setError(`Priority ${selectedPriority} is already in use by one of your projects.`);
      return;
    }

    setLocalLoading(true);
    try {
      const res = await joinGroupProject(projectDetail.groupProjectId, { priority: selectedPriority });
      if (res.success) {
        setSuccess('Successfully joined group project! Created sub-personal project.');
        loadDetails();
        onSuccess?.();
        setShowRegenerateSuggest(true);
      } else {
        setError(res.error || 'Failed to join group project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        setSuccess('Group project dissolved.');
        loadDetails();
        onSuccess?.();
      } else {
        setError(res.error || 'Failed to dissolve group project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8 overflow-hidden transition-all transform flex flex-col max-h-[90vh]"
          style={{ backgroundColor: colors.background.primary }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: colors.border.light }}>
            <div>
              <Heading level={3}>
                {group?.name || 'Loading group...'}
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
                    <Text className="text-xs uppercase font-bold" style={{ color: colors.text.secondary }}>Status</Text>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.status === 'LOCKED' ? '#F59E0B' : group.status === 'DISSOLVED' ? '#EF4444' : '#10B981' }} />
                      <Text className="font-semibold">{group.status}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && !group.groupProjectId && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setIsConfirmDeleteOpen(true)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5"
                      >
                        <MdDelete size={16} />
                        Delete Group
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
                        Lock Group
                      </Button>
                    )}
                    {isAdmin && isLocked && !group.groupProjectId && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleUnlockGroup}
                        disabled={isLoading}
                        className="flex items-center gap-1.5"
                      >
                        <MdLockOpen size={16} />
                        Unlock Group
                      </Button>
                    )}
                  </div>
                </div>

                {/* Group Project Info */}
                {projectDetail ? (
                  <div className="border rounded-xl p-4 space-y-4" style={{ borderColor: colors.border.light }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <Heading level={4} style={{ color: colors.text.primary }}>Group Project: {projectDetail.name}</Heading>
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
                          Dissolve Project
                        </Button>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Text style={{ color: colors.text.secondary }}>Total Saved</Text>
                        <Text className="font-semibold">
                          {formatNumber(projectDetail.aggregateMoneySaved ?? 0)} / {formatNumber(projectDetail.targetAmount ?? 0)} {projectDetail.currency}
                        </Text>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden flex" style={{ backgroundColor: colors.background.secondary }}>
                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, projectDetail.progressPercent)}%`,
                            backgroundColor: colors.interactive.primary,
                          }}
                        />
                      </div>
                      <Text className="text-right text-xs font-semibold" style={{ color: colors.interactive.primary }}>
                        {(projectDetail.progressPercent ?? 0).toFixed(1)}% Completed
                      </Text>
                    </div>

                    {/* Join flow for current user (only when ACTIVE) */}
                    {!hasJoinedProject() && group?.status !== 'DISSOLVED' && projectDetail.status === 'ACTIVE' && (
                      <div className="p-4 border rounded-xl space-y-3" style={{ borderColor: colors.border.light, backgroundColor: `${colors.interactive.primary}05` }}>
                        <Heading level={4} className='pb-2'>Join Group Project</Heading>
                        <Text className="text-xs">
                          Select priority to create your personal sub-project and contribute to the group goal.
                        </Text>
                        <div className="flex gap-2">
                          {(['LOW', 'MEDIUM', 'HIGH'] as const).map((pri) => {
                            const isUsed = usedPriorities.includes(pri);
                            return (
                              <button
                                key={pri}
                                type="button"
                                disabled={isUsed}
                                onClick={() => setSelectedPriority(pri)}
                                className={`flex-1 py-2 px-3 rounded-lg border text-center text-xs font-semibold transition-all ${isUsed ? 'opacity-40 cursor-not-allowed' : 'hover:cursor-pointer'}`}
                                style={{
                                  borderColor: selectedPriority === pri ? colors.interactive.primary : colors.border.light,
                                  backgroundColor: selectedPriority === pri ? `${colors.interactive.primary}10` : 'white',
                                  color: selectedPriority === pri ? colors.interactive.primary : colors.text.primary,
                                }}
                              >
                                {pri} {isUsed && '(Used)'}
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
                          Accept & Create Project
                        </Button>
                      </div>
                    )}

                    {/* Sponsorship survey pending notice & response actions */}
                    {group?.status !== 'DISSOLVED' && projectDetail.status === 'PENDING_SPONSORSHIP' && (
                      <div className="p-4 border rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 space-y-3 animate-fade-in" style={{ borderColor: '#F59E0B30' }}>
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          {myPendingRequest ? 'Yêu Cầu Hỗ Trợ Đang Chờ Bạn Phản Hồi' : 'Đang chờ khảo sát ý kiến đồng đội...'}
                        </div>
                        {myPendingRequest ? (
                          <div className="space-y-3">
                            <Text className="text-xs text-gray-600 leading-relaxed">
                              Đồng đội trong nhóm của bạn không đủ khả năng tài chính. Hệ thống đề xuất bạn hỗ trợ thêm{' '}
                              <strong>{Number(myPendingRequest.askedAmount).toLocaleString()} VND/tháng</strong> (nâng mức đóng góp của bạn lên{' '}
                              <strong>{Number(myPendingRequest.proposedShare).toLocaleString()} VND/tháng</strong> thay vì{' '}
                              <strong>{Number(myPendingRequest.originalShare).toLocaleString()} VND/tháng</strong>).
                            </Text>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRespondSponsorship(false)}
                                disabled={localLoading}
                                style={{ color: '#EF4444', borderColor: '#EF444420', backgroundColor: 'transparent' }}
                              >
                                Từ chối
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleRespondSponsorship(true)}
                                disabled={localLoading}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                              >
                                Đồng ý giúp
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Text className="text-xs text-gray-500">
                            Dự án đang chờ các thành viên phản hồi khảo sát đóng góp giúp để kích hoạt.
                          </Text>
                        )}
                      </div>
                    )}

                    {/* Sponsorship failed notice */}
                    {group?.status !== 'DISSOLVED' && projectDetail.status === 'SPONSORSHIP_FAILED' && (
                      <div className="p-4 border rounded-xl bg-red-50 text-red-800 text-xs font-semibold" style={{ borderColor: '#EF444430' }}>
                        Dự án này đã thất bại do các thành viên từ chối hoặc không đủ khả năng đóng góp giúp.
                      </div>
                    )}
                  </div>
                ) : (
                  isAdmin && isLocked && (
                    <div className="border border-dashed rounded-xl p-6 text-center space-y-3" style={{ borderColor: colors.border.light }}>
                      <Text style={{ color: colors.text.secondary }} className="text-sm">
                        This group is locked but has no associated Group Project yet.
                      </Text>
                      <Button
                        variant="primary"
                        onClick={() => {
                          onClose();
                          onCreateProject?.(group.groupId);
                        }}
                      >
                        Create Group Project
                      </Button>
                    </div>
                  )
                )}

                {/* Auto-Sponsorship Settings Panel */}
                {group.status !== 'DISSOLVED' && (
                  <div className="p-4 border rounded-xl space-y-3 bg-gradient-to-r from-blue-50/20 to-indigo-50/20" style={{ borderColor: colors.border.light }}>
                    <div className="text-[11px] font-semibold text-blue-700 bg-blue-100/40 px-2.5 py-1 rounded-md border border-blue-200/50 inline-block mb-1">
                      Lựa chọn hiện tại: {savedSponsorshipText}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <Heading level={4} className="text-sm font-bold flex items-center gap-1.5" style={{ color: colors.interactive.primary }}>
                          <MdAutoAwesome />
                          Tự Động Hỗ Trợ Đồng Đội (Auto-Sponsor)
                        </Heading>
                        <Text className="text-[11px]" style={{ color: colors.text.secondary }}>
                          Hệ thống sẽ tự động trích quỹ usable dư thừa để bù đắp phần thiếu hụt của đồng đội khi tạo dự án.
                        </Text>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSponsorEnabled}
                          onChange={(e) => setAutoSponsorEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {autoSponsorEnabled && (
                      <div className="space-y-3 pt-2 border-t border-dashed" style={{ borderColor: colors.border.light }}>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-700">
                            <input
                              type="radio"
                              name="sponsorLimitType"
                              checked={autoSponsorLimitType === 'MAX'}
                              onChange={() => setAutoSponsorLimitType('MAX')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            Tối đa khả năng (Toàn bộ thặng dư)
                          </label>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-gray-700">
                            <input
                              type="radio"
                              name="sponsorLimitType"
                              checked={autoSponsorLimitType === 'CUSTOM'}
                              onChange={() => setAutoSponsorLimitType('CUSTOM')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            Hạn mức tối đa cụ thể
                          </label>
                        </div>

                        {autoSponsorLimitType === 'CUSTOM' && (
                          <div className="max-w-xs">
                            <label className="block text-xs font-medium mb-1 text-gray-500">Hạn mức hỗ trợ tối đa mỗi tháng (VND)</label>
                            <Input
                              type="text"
                              value={autoSponsorLimit}
                              onChange={(e) => setAutoSponsorLimit(formatAmountInput(e.target.value))}
                              placeholder="Nhập số tiền, ví dụ: 200,000"
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
                        {isSavingSponsorship ? 'Đang lưu...' : 'Lưu cấu hình'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Member lineup & individual progress */}
                <div className="space-y-3">
                  <Heading level={4} className='pb-2'>Members</Heading>
                  <div className="divide-y border rounded-xl overflow-hidden" style={{ borderColor: colors.border.light }}>
                    {group.members.map((member) => {
                      const prog = projectDetail?.members.find(m => m.userId === member.userId);
                      const isCurrentUser = member.userId === user?.id;
                      return (
                        <div
                          key={member.userId}
                          className="p-4 flex items-center justify-between flex-wrap gap-4 transition-all"
                          style={{
                            backgroundColor: isCurrentUser ? `${colors.interactive.primary}08` : 'white',
                            borderLeft: isCurrentUser ? `4px solid ${colors.interactive.primary}` : 'none',
                            paddingLeft: isCurrentUser ? '12px' : '16px',
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Text className={`font-semibold ${isCurrentUser ? 'font-bold' : ''}`} style={{ color: isCurrentUser ? colors.interactive.primary : colors.text.primary }}>
                                {member.username || 'User'} {isCurrentUser && '(You)'}
                              </Text>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0" style={{
                                backgroundColor: member.role === 'ADMIN' ? `${colors.interactive.primary}15` : colors.background.secondary,
                                color: member.role === 'ADMIN' ? colors.interactive.primary : colors.text.secondary
                              }}>
                                {member.role}
                              </span>
                            </div>
                            {member.email && (
                              <div className="text-xs text-gray-400 mt-0.5">{member.email}</div>
                            )}
                            <div className="flex gap-2 items-center mt-1 text-xs text-gray-500">
                              {projectDetail ? (
                                prog?.projectStatus === 'ABANDONED' && (
                                  <span className="flex items-center gap-1 text-red-500 font-semibold uppercase">
                                    <MdCancel className="text-red-500" />
                                    ABANDONED
                                  </span>
                                )
                              ) : (
                                <span className="flex items-center gap-1">
                                  {member.inviteStatus === 'JOINED' && <MdCheckCircle className="text-green-500" />}
                                  {member.inviteStatus === 'INVITED' && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
                                  {member.inviteStatus === 'DECLINED' && <MdCancel className="text-red-500" />}
                                  {member.inviteStatus}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Member Progress details if joined */}
                          {prog && prog.personalProjectId ? (
                            <div className="text-right">
                              <div className="text-[11px] font-bold mt-0.5" style={{ color: colors.interactive.primary }}>
                                {(prog.progressPercent ?? 0).toFixed(0)}% Progress
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {isAdmin && isForming && member.inviteStatus === 'INVITED' && (
                                <>
                                  {sentEmails[member.email] ? (
                                    <span
                                      className="text-xs px-2.5 py-1 rounded-md border font-medium flex items-center gap-1 bg-green-50 text-green-700 border-green-300"
                                      title={`Invitation successfully resent to ${member.email}`}
                                    >
                                      <MdCheckCircle className="w-3.5 h-3.5 text-green-600" />
                                      Sent!
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleResendInvite(member.email)}
                                      disabled={isLoading || resendingEmail === member.email}
                                      className={`text-xs px-2.5 py-1 rounded-md border transition-all font-medium flex items-center gap-1 ${resendingEmail === member.email
                                          ? 'bg-amber-50/50 text-amber-700/60 border-amber-200 cursor-not-allowed'
                                          : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 active:bg-amber-200 cursor-pointer'
                                        }`}
                                      title={`Resend invitation to ${member.email}`}
                                    >
                                      {resendingEmail === member.email ? (
                                        <>
                                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-amber-700" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                          </svg>
                                          Resending...
                                        </>
                                      ) : (
                                        'Resend'
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
                                    title="Kick invited member"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </>
                              )}
                              {isAdmin && isForming && member.inviteStatus === 'DECLINED' && (
                                <button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove declined invitation"
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
                  <form onSubmit={handleInvite} className="border-t pt-4 shrink-0 space-y-2">
                    <label className="block text-sm font-medium" style={{ color: colors.text.primary }}>Invite a new member</label>
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
                        Invite
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsConfirmDeleteOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1011 }}>
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col"
              style={{ backgroundColor: colors.background.primary }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-500">
                <MdDelete className="w-8 h-8" style={{ color: '#EF4444' }} />
                <Heading level={4} style={{ color: colors.text.primary }}>Delete Group</Heading>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Are you sure you want to delete this group? This will remove all members and delete the group permanently. This action cannot be undone.
              </Text>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmDeleteOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDeleteGroup}
                  disabled={isLoading}
                  style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: 'white' }}
                >
                  Confirm Delete
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setIsConfirmDissolveOpen(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1011 }}>
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col"
              style={{ backgroundColor: colors.background.primary }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-500">
                <MdCancel className="w-8 h-8" style={{ color: '#EF4444' }} />
                <Heading level={4} style={{ color: colors.text.primary }}>Dissolve Group Project</Heading>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                Are you sure you want to dissolve this group project? This will dissolve the group and abandon all sub-personal projects. This action cannot be undone.
              </Text>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmDissolveOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleDissolveProject}
                  disabled={isLoading}
                  style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', color: 'white' }}
                >
                  Confirm Dissolve
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1010,
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setShowRegenerateSuggest(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1011 }}>
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col"
              style={{ backgroundColor: colors.background.primary }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-indigo-600">
                <MdAutoAwesome className="w-8 h-8" style={{ color: colors.interactive.primary }} />
                <Heading level={4} style={{ color: colors.text.primary }}>Recalculate Budget?</Heading>
              </div>
              <Text style={{ color: colors.text.secondary }} className="text-sm">
                You have successfully joined the group project! Would you like AI to recalculate your spending budget to align with this new savings goal?
              </Text>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowRegenerateSuggest(false)}
                  disabled={isLoading}
                >
                  Later
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowRegenerateSuggest(false);
                    setIsGenerateBudgetOpen(true);
                  }}
                  disabled={isLoading}
                >
                  Recalculate Now
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
