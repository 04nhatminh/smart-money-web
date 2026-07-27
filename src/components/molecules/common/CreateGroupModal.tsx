'use client';

import React, { useState, useEffect } from 'react';
import { Button, Heading, Text, Input, Alert } from '@/components/atoms';
import { useTheme } from '@/context/ThemeContext';
import { useGroups } from '@/hooks/useGroups';
import { useTranslations } from 'next-intl';
import { MdClose, MdPersonAdd } from 'react-icons/md';

import type { GroupSummaryResponse } from '@/types/group.api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const { createGroup, inviteGroupMember, listGroups, isLoading } = useGroups();
  const t = useTranslations();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [myGroups, setMyGroups] = useState<GroupSummaryResponse[]>([]);
  const [cloneGroupId, setCloneGroupId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setEmails([]);
      setCurrentEmail('');
      setCloneGroupId('');
      setError(null);
      setSuccess(false);
      document.body.style.overflow = 'hidden';

      // Fetch user's existing groups
      listGroups().then((res) => {
        if (res.success && res.data) {
          setMyGroups(res.data);
        }
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, listGroups]);

  const handleAddEmail = () => {
    if (!currentEmail.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail.trim())) {
      setError(t('createGroupModal.invalidEmail'));
      return;
    }
    if (emails.includes(currentEmail.trim())) {
      setError(t('createGroupModal.emailExists'));
      return;
    }
    setEmails([...emails, currentEmail.trim()]);
    setCurrentEmail('');
    setError(null);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      const result = await createGroup({
        name: name.trim(),
        description: description.trim(),
        cloneGroupId: cloneGroupId || undefined,
      });
      if (result.success && result.data) {
        const newGroupId = result.data.groupId;
        const failedEmails: string[] = [];

        // Only invite manually added emails if we are not cloning
        if (!cloneGroupId) {
          // Invite members sequentially
          for (const email of emails) {
            try {
              const inviteRes = await inviteGroupMember(newGroupId, { email });
              if (!inviteRes.success) {
                console.error(`Failed to invite ${email}:`, inviteRes.error);
                failedEmails.push(email);
              }
            } catch (inviteErr) {
              console.error(`Error inviting ${email}:`, inviteErr);
              failedEmails.push(email);
            }
          }
        }

        if (failedEmails.length > 0) {
          setError(`Group created, but failed to invite: ${failedEmails.join(', ')}`);
        } else {
          setSuccess(true);
        }

        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, failedEmails.length > 0 ? 3000 : 1500);
      } else {
        setError(result.error || 'Failed to create group');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 1000 }}>
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8 overflow-hidden transition-all transform"
          style={{ backgroundColor: colors.background.primary }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: colors.border.light }}>
            <Heading level={3} className="m-0">
              Create New Group
            </Heading>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:opacity-75 hover:cursor-pointer"
              style={{ color: colors.text.secondary }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {success && (
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: `${colors.interactive.success}20`,
                  color: colors.interactive.success,
                }}
              >
                <Text className="font-semibold">Group created successfully!</Text>
              </div>
            )}

            {error && (
              <Alert message={error} type="error" onClose={() => setError(null)} />
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Group Name <span style={{ color: colors.interactive.danger }}>*</span>
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Family Savings, Trip Squad"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your group's goals..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 resize-none"
                style={{
                  borderColor: colors.border.light,
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                  fontFamily: 'inherit',
                }}
                disabled={isLoading}
              />
            </div>

            {/* Clone existing group */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                Clone from existing group (optional)
              </label>
              <select
                value={cloneGroupId}
                onChange={(e) => {
                  setCloneGroupId(e.target.value);
                  if (e.target.value) {
                    setEmails([]);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: colors.border.light,
                  backgroundColor: colors.background.secondary,
                  color: colors.text.primary,
                }}
                disabled={isLoading}
              >
                <option value="">-- Select group to clone --</option>
                {myGroups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    {g.name} ({g.memberCount} members)
                  </option>
                ))}
              </select>
            </div>

            {/* Invite Members Block */}
            {!cloneGroupId ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>
                    Invite Members by Email
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={currentEmail}
                      onChange={(e) => setCurrentEmail(e.target.value)}
                      placeholder="user@example.com"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddEmail}
                      disabled={isLoading}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <MdPersonAdd size={18} />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Invited Emails Chips */}
                {emails.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg border" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                    {emails.map((email, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-white"
                        style={{ borderColor: colors.border.light, color: colors.text.primary }}
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(idx)}
                          className="hover:text-red-500 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="p-3 rounded-lg border text-sm" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary, color: colors.text.secondary }}>
                Members from the selected group will be automatically invited.
              </div>
            )}

            {/* Footer Buttons */}
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
  );
};
