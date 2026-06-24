'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { GroupDetailResponse, GroupProjectDetailResponse, GroupMemberResponse } from '@/types/group.api';
import { formatAmountInput, parseFormattedNumber, formatNumber, formatPrice } from '@/lib/format';
import { MdClose, MdLock, MdPersonAdd, MdDelete, MdAddCircle, MdCheckCircle, MdCancel, MdRefresh } from 'react-icons/md';

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
    inviteGroupMember,
    removeGroupMember,
    getGroupProjectDetail,
    joinGroupProject,
    dissolveGroupProject,
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
        if (res.data.groupProjectId) {
          const projRes = await getGroupProjectDetail(res.data.groupProjectId);
          if (projRes.success && projRes.data) {
            setProjectDetail(projRes.data);
          }
        } else {
          setProjectDetail(null);
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
    setLocalLoading(true);
    try {
      const res = await inviteGroupMember(group.groupId, { email });
      if (res.success) {
        setSuccess(`Invitation resent to ${email}!`);
      } else {
        setError(res.error || 'Failed to resend invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLocalLoading(false);
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

                    {/* Join flow for current user */}
                    {!hasJoinedProject() && group?.status !== 'DISSOLVED' && (
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

                {/* Member lineup & individual progress */}
                <div className="space-y-3">
                  <Heading level={4} className='pb-2'>Members</Heading>
                  <div className="divide-y border rounded-xl overflow-hidden" style={{ borderColor: colors.border.light }}>
                    {group.members.map((member) => {
                      const prog = projectDetail?.members.find(m => m.userId === member.userId);
                      return (
                        <div key={member.userId} className="p-4 flex items-center justify-between flex-wrap gap-4" style={{ backgroundColor: 'white' }}>
                          <div>
                            <div className="flex items-center gap-2">
                              <Text className="font-semibold">{member.username || 'User'}</Text>
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0" style={{
                                backgroundColor: member.role === 'ADMIN' ? `${colors.interactive.primary}15` : colors.background.secondary,
                                color: member.role === 'ADMIN' ? colors.interactive.primary : colors.text.secondary
                              }}>
                                {member.role}
                              </span>
                            </div>
                            <div className="flex gap-2 items-center mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                {member.inviteStatus === 'JOINED' && <MdCheckCircle className="text-green-500" />}
                                {member.inviteStatus === 'INVITED' && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
                                {member.inviteStatus === 'DECLINED' && <MdCancel className="text-red-500" />}
                                {member.inviteStatus}
                              </span>
                              {member.capacitySnapshot != null && <span>&bull; Snap: {formatPrice(member.capacitySnapshot)}</span>}
                            </div>
                          </div>

                          {/* Member Progress details if joined */}
                          {prog && prog.personalProjectId ? (
                            <div className="text-right">
                              <Text className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                                Net: {formatNumber(prog.netSaved ?? 0)} / {formatNumber(prog.targetAmount ?? 0)}
                              </Text>
                              <div className="text-[11px] font-bold mt-0.5" style={{ color: colors.interactive.primary }}>
                                {(prog.progressPercent ?? 0).toFixed(0)}% Progress
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {isAdmin && member.inviteStatus === 'INVITED' && (
                                <button
                                  onClick={() => handleResendInvite(member.email)}
                                  disabled={isLoading}
                                  className="p-2 rounded-lg transition-colors hover:bg-yellow-50 disabled:opacity-50"
                                  style={{ color: '#F59E0B' }}
                                  title={`Resend invitation to ${member.email}`}
                                >
                                  <MdRefresh size={18} />
                                </button>
                              )}
                              {isAdmin && member.inviteStatus === 'DECLINED' && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 transition-all transform flex flex-col"
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
    </>
  );
};
