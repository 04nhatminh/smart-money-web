'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { SidebarLayout } from '@/components/templates';
import { Heading, Text, Button, Input, Skeleton } from '@/components/atoms';
import { Card, StatCard } from '@/components/molecules/common';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { adminService } from '@/services/admin';
import { useProjects } from '@/hooks/useProjects';
import { useGroups } from '@/hooks/useGroups';
import { formatVietnamsePrice, parseNotificationPayload } from '@/lib/format';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import {
  MdAdminPanelSettings,
  MdRefresh,
  MdPlayArrow,
  MdPeople,
  MdFolderOpen,
  MdGroup,
  MdSwapHoriz,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdSearch,
  MdCampaign,
  MdAccountTree,
  MdHourglassEmpty,
  MdSecurity,
  MdSpeed,
  MdDns,
  MdClose,
  MdSend,
  MdFilterList,
  MdExpandMore,
  MdNotifications
} from 'react-icons/md';

// Mock system users list for demo & management
interface SystemUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  financialSetup: boolean;
  financialSetupCompleted?: boolean;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedDate: string;
  createdAt?: string;
  lastActive: string;
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: 'usr-1',
    name: 'Admin Manager',
    email: 'admin@smartmoney.io',
    role: 'ADMIN',
    financialSetup: true,
    status: 'ACTIVE',
    joinedDate: '2026-01-10',
    lastActive: 'Just now'
  },
  {
    id: 'usr-2',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    role: 'USER',
    financialSetup: true,
    status: 'ACTIVE',
    joinedDate: '2026-02-15',
    lastActive: '10 minutes ago'
  },
  {
    id: 'usr-3',
    name: 'Trần Thị B',
    email: 'tranthib@gmail.com',
    role: 'USER',
    financialSetup: true,
    status: 'ACTIVE',
    joinedDate: '2026-03-01',
    lastActive: '2 hours ago'
  },
  {
    id: 'usr-4',
    name: 'Lê Hoàng C',
    email: 'lehoangc@company.com',
    role: 'MANAGER',
    financialSetup: false,
    status: 'PENDING',
    joinedDate: '2026-04-12',
    lastActive: '1 day ago'
  },
  {
    id: 'usr-5',
    name: 'Phạm Minh D',
    email: 'phamminhd@yahoo.com',
    role: 'USER',
    financialSetup: true,
    status: 'SUSPENDED',
    joinedDate: '2026-05-20',
    lastActive: '5 days ago'
  }
];

// System growth mock data for chart
const SYSTEM_GROWTH_DATA = [
  { month: 'Jan', users: 24, transactions: 180, volume: 45000000 },
  { month: 'Feb', users: 48, transactions: 420, volume: 110000000 },
  { month: 'Mar', users: 76, transactions: 810, volume: 230000000 },
  { month: 'Apr', users: 95, transactions: 1150, volume: 310000000 },
  { month: 'May', users: 112, transactions: 1380, volume: 360000000 },
  { month: 'Jun', users: 128, transactions: 1450, volume: 385000000 }
];

export default function AdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const { colors } = useTheme();

  const {
    isSettlementRunning,
    settlementResult,
    settlementHistory,
    runSettlement,
    isBroadcasting,
    broadcastStatus,
    sendBroadcast
  } = useAdmin();

  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'settlement' | 'users' | 'logs'>('overview');
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const { user: currentUser, isAuthenticated, isInitializing } = useAuth();

  // Redirect non-admin users to /dashboard
  useEffect(() => {
    if (!isInitializing) {
      if (!isAuthenticated) {
        router.push(`/${locale}/login`);
      } else if (currentUser && currentUser.role !== 'ADMIN') {
        router.push(`/${locale}/dashboard`);
      }
    }
  }, [isAuthenticated, isInitializing, currentUser, router, locale]);

  // User management state
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Custom dropdown & Notifications state
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'URGENT'>('INFO');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Load real notifications for Admin
  const loadAdminNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const res = await apiClient.get<any>('/api/v1/notifications');
      if (res?.success && Array.isArray(res?.data)) {
        setAdminNotifications(res.data);
      }
    } catch (err) {
      console.error('Error loading admin notifications:', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Load strictly system-wide admin data from backend
  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [usersRes, statsRes] = await Promise.allSettled([
        adminService.getAllUsers(),
        adminService.getSystemStats()
      ]);

      if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
        setUsers(usersRes.value as any);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setSystemStats(statsRes.value);
      }

      await loadAdminNotifications();
    } catch (err) {
      console.error('Error loading admin overview data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const nameStr = String(u?.name || u?.fullName || '').toLowerCase();
      const emailStr = String(u?.email || '').toLowerCase();
      const searchStr = String(userSearch || '').toLowerCase();
      const matchSearch = nameStr.includes(searchStr) || emailStr.includes(searchStr);
      const matchStatus = userStatusFilter === 'ALL' || u?.status === userStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  // Handle user status toggle
  const toggleUserStatus = async (userId: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
    await adminService.toggleUserStatus(userId);
  };

  // Filtered broadcast history logs (only show notifications matching broadcast format)
  const broadcastHistory = useMemo(() => {
    return adminNotifications.filter(n => {
      const parsed = parseNotificationPayload(n?.content || '');
      return parsed.isBroadcast;
    });
  }, [adminNotifications]);

  // Handle Broadcast submit
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;
    const res = await sendBroadcast(broadcastTitle, broadcastMsg, broadcastSeverity);
    if (res.success) {
      setBroadcastSuccess(true);
      await loadAdminNotifications();
      setTimeout(() => {
        setBroadcastSuccess(false);
        setBroadcastTitle('');
        setBroadcastMsg('');
      }, 1500);
    }
  };

  // Prevent flash of Admin UI for non-admin or unauthenticated users
  if (isInitializing || !isAuthenticated || (currentUser && currentUser.role !== 'ADMIN')) {
    return (
      <SidebarLayout showSidebar={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <MdRefresh className="w-8 h-8 animate-spin" style={{ color: colors.interactive.primary }} />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout showSidebar={false}>
      <div className="space-y-6">
        {/* Admin Page Glassmorphic Header */}
        <div
          className="p-6 rounded-2xl border shadow-xl transition-all relative overflow-hidden"
          style={{
            borderColor: colors.border.light,
            backgroundColor: colors.surface.primary,
            backdropFilter: 'blur(12px)'
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl flex items-center justify-center shadow-md"
                  style={{ backgroundColor: colors.interactive.primary, color: '#ffffff' }}
                >
                  <MdAdminPanelSettings className="w-6 h-6" />
                </div>
                <div>
                  <Heading level={2} className="text-xl sm:text-2xl font-black flex items-center gap-2">
                    {t('admin.title')}
                  </Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm">
                    {t('admin.subtitle')}
                  </Text>
                </div>
              </div>
            </div>

            {/* Quick Action & Health Indicator */}
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                  color: '#10B981'
                }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>{t('admin.statusOnline')}</span>
              </div>

              <button
                onClick={loadAdminData}
                className="p-2 rounded-xl border transition-all hover:opacity-80"
                style={{ borderColor: colors.border.light, color: colors.text.primary }}
                title={t('common.refresh')}
              >
                <MdRefresh className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b pt-2 overflow-x-auto" style={{ borderColor: colors.border.light }}>
            {[
              { id: 'overview', label: t('admin.tabs.overview'), icon: MdSpeed },
              { id: 'settlement', label: t('admin.tabs.settlement'), icon: MdAccountTree },
              { id: 'users', label: t('admin.tabs.users'), icon: MdPeople },
              { id: 'logs', label: t('admin.tabs.logs'), icon: MdDns }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${isActive ? 'border-indigo-600' : 'border-transparent opacity-70 hover:opacity-100 hover:cursor-pointer'
                    }`}
                  style={{
                    borderColor: isActive ? colors.interactive.primary : 'transparent',
                    color: isActive ? colors.interactive.primary : colors.text.secondary
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            {isLoadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="p-6 border space-y-3" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
                    <div className="flex justify-between items-center">
                      <Skeleton variant="text" width="55%" height="1rem" />
                      <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                    </div>
                    <Skeleton variant="text" width="40%" height="2rem" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label={t('admin.kpi.totalUsers')}
                  value={(systemStats?.totalUsers ?? users.length).toString()}
                  icon={<MdPeople className="w-6 h-6 text-indigo-500" />}
                />
                <StatCard
                  label={t('admin.kpi.activeUsers')}
                  value={(systemStats?.activeUsersCount ?? users.filter(u => u.status === 'ACTIVE').length).toString()}
                  icon={<MdCheckCircle className="w-6 h-6 text-emerald-500" />}
                />
                <StatCard
                  label={t('admin.kpi.monthlyVolume')}
                  value={formatVietnamsePrice(systemStats?.totalTransactionVolume ?? 0)}
                  icon={<MdSwapHoriz className="w-6 h-6 text-amber-500" />}
                />
                <StatCard
                  label={t('admin.kpi.settlementStatus')}
                  value={isSettlementRunning ? t('admin.settlement.running') : (systemStats?.settlementStatus || 'COMPLETED')}
                  icon={<MdCheckCircle className="w-6 h-6 text-emerald-500" />}
                />
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User & Transaction Growth Area Chart */}
              <Card className="lg:col-span-2 p-6 sm:p-7 border" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
                <div className="flex items-center justify-between mb-6 border-b pb-4" style={{ borderColor: colors.border.light }}>
                  <div className="space-y-1">
                    <Heading level={3} className="text-lg font-bold">System Volume & Activity Growth</Heading>
                    <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm block">Monthly transactions vs volume throughput</Text>
                  </div>
                </div>
                <div className="h-64 sm:h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SYSTEM_GROWTH_DATA}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.interactive.primary} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={colors.interactive.primary} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.text.secondary }} />
                      <YAxis tick={{ fontSize: 11, fill: colors.text.secondary }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: colors.surface.primary,
                          borderColor: colors.border.light,
                          borderRadius: '8px',
                          color: colors.text.primary
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="transactions"
                        stroke={colors.interactive.primary}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVolume)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* System Infrastructure Health Card */}
              <Card className="p-6 sm:p-7 border flex flex-col justify-between" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
                <div>
                  <div className="mb-6 border-b pb-4" style={{ borderColor: colors.border.light }}>
                    <Heading level={3} className="text-lg font-bold mb-1">System Health & AI Engines</Heading>
                    <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm block">Infrastructure status monitoring</Text>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                      <div className="flex items-center gap-3">
                        <MdSecurity className="w-5 h-5 text-indigo-500" />
                        <div>
                          <Text className="text-xs font-bold block">Spring Boot API Backend</Text>
                          <Text className="text-[10px]" style={{ color: colors.text.secondary }}>v1.0.0 • Port 8080</Text>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">HEALTHY</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                      <div className="flex items-center gap-3">
                        <MdAccountTree className="w-5 h-5 text-emerald-500" />
                        <div>
                          <Text className="text-xs font-bold block">Settlement Scheduler</Text>
                          <Text className="text-[10px]" style={{ color: colors.text.secondary }}>Cron: Monthly 1st 00:00</Text>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">ACTIVE</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-xl border" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                      <div className="flex items-center gap-3">
                        <MdSpeed className="w-5 h-5 text-amber-500" />
                        <div>
                          <Text className="text-xs font-bold block">Budget AI Engine</Text>
                          <Text className="text-[10px]" style={{ color: colors.text.secondary }}>Adaptive Engine Active</Text>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">READY</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t mt-6" style={{ borderColor: colors.border.light }}>
                  <Button
                    variant="primary"
                    onClick={() => setActiveTab('settlement')}
                    className="w-full text-xs py-2.5 font-bold justify-center"
                  >
                    {t('admin.overviewSection.manageSettlementBtn')}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: MONTHLY SETTLEMENT */}
        {activeTab === 'settlement' && (
          <div className="space-y-6">
            <Card className="p-6 sm:p-7 border space-y-6" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 mb-2" style={{ borderColor: colors.border.light }}>
                <div className="space-y-1">
                  <Heading level={3} className="text-lg font-bold flex items-center gap-2.5">
                    <MdAccountTree className="w-6 h-6 text-indigo-500" />
                    {t('admin.settlement.title')}
                  </Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm block">
                    {t('admin.settlement.subtitle')}
                  </Text>
                </div>

                <Button
                  variant="primary"
                  onClick={runSettlement}
                  disabled={isSettlementRunning}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm py-2.5 px-5 font-bold shadow-lg shrink-0"
                >
                  <MdPlayArrow className={`w-5 h-5 ${isSettlementRunning ? 'animate-spin' : ''}`} />
                  <span>{isSettlementRunning ? t('admin.settlement.running') : t('admin.settlement.runButton')}</span>
                </Button>
              </div>

              {/* Status Alert if Settlement Result exists */}
              {settlementResult && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 my-4 ${settlementResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                >
                  {settlementResult.success ? (
                    <MdCheckCircle className="w-6 h-6 flex-shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <MdError className="w-6 h-6 flex-shrink-0 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <Text className="font-bold text-sm block">
                      {settlementResult.success ? t('admin.settlement.successMessage') : 'Settlement Failed'}
                    </Text>
                    <Text className="text-xs opacity-90">{settlementResult.message}</Text>
                  </div>
                </div>
              )}

              {/* Settlement Information Callout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                <div className="p-4.5 rounded-2xl border space-y-1.5 shadow-sm" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                  <Text className="text-xs font-semibold block" style={{ color: colors.text.secondary }}>Target API Endpoint</Text>
                  <Text className="font-mono text-xs font-bold text-indigo-400 block">POST /api/v1/admin/settlement/run</Text>
                </div>
                <div className="p-4.5 rounded-2xl border space-y-1.5 shadow-sm" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                  <Text className="text-xs font-semibold block" style={{ color: colors.text.secondary }}>Process Execution Scope</Text>
                  <Text className="text-xs font-bold block" style={{ color: colors.text.primary }}>All Active Projects & Group Settlements</Text>
                </div>
                <div className="p-4.5 rounded-2xl border space-y-1.5 shadow-sm" style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}>
                  <Text className="text-xs font-semibold block" style={{ color: colors.text.secondary }}>Backend Controller Class</Text>
                  <Text className="font-mono text-xs font-bold block text-emerald-400">AdminSettlementController</Text>
                </div>
              </div>

              {/* Settlement History Logs Table */}
              <div className="space-y-4 pt-6 mt-6 border-t" style={{ borderColor: colors.border.light }}>
                <Heading level={4} className="text-base font-bold mb-3 pb-1">{t('admin.settlement.history')}</Heading>
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: colors.border.light }}>
                  <table className="w-full text-left text-xs">
                    <thead style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}>
                      <tr>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Triggered By</th>
                        <th className="p-3.5">Duration</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: colors.border.light }}>
                      {settlementHistory.map((log) => (
                        <tr key={log.id} className="hover:opacity-90">
                          <td className="p-3.5 font-mono" style={{ color: colors.text.secondary }}>
                            {new Date(log.timestamp).toLocaleString(locale)}
                          </td>
                          <td className="p-3.5 font-semibold" style={{ color: colors.text.primary }}>
                            {log.triggeredBy}
                          </td>
                          <td className="p-3.5 font-mono">{log.durationMs} ms</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs truncate" style={{ color: colors.text.secondary }}>
                            {log.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card className="p-6 sm:p-7 border space-y-6" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 mb-6" style={{ borderColor: colors.border.light }}>
                <div className="space-y-1">
                  <Heading level={3} className="text-lg font-bold">{t('admin.users.title')}</Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm block">
                    Manage system user roles, access statuses, and financial profile setups
                  </Text>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Search Bar */}
                  <div className="relative min-w-[240px]">
                    <MdSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.secondary }} />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={t('admin.users.searchPlaceholder')}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border transition-all outline-none focus:ring-2 focus:ring-indigo-500/30"
                      style={{
                        borderColor: colors.border.light,
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary
                      }}
                    />
                  </div>

                  {/* Custom Styled Status Filter Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm rounded-xl border font-semibold transition-all shadow-sm hover:cursor-pointer"
                      style={{
                        borderColor: colors.border.light,
                        backgroundColor: colors.background.secondary,
                        color: colors.text.primary
                      }}
                    >
                      <MdFilterList className="w-4 h-4 text-indigo-400" />
                      <span>
                        {userStatusFilter === 'ALL' && (t('admin.users.filterAll') || 'All Statuses')}
                        {userStatusFilter === 'ACTIVE' && (t('admin.users.filterActive') || 'Active')}
                        {userStatusFilter === 'PENDING' && (t('admin.users.filterPending') || 'Pending')}
                        {userStatusFilter === 'SUSPENDED' && (t('admin.users.filterSuspended') || 'Suspended')}
                      </span>
                      <MdExpandMore className={`w-4 h-4 transition-transform duration-200 ${isFilterDropdownOpen ? 'rotate-180' : ''}`} style={{ color: colors.text.secondary }} />
                    </button>

                    {isFilterDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsFilterDropdownOpen(false)} />
                        <div
                          className="absolute right-0 mt-2 w-48 rounded-2xl shadow-xl border py-2 z-50 overflow-hidden backdrop-blur-md transition-all"
                          style={{
                            backgroundColor: colors.surface.primary,
                            borderColor: colors.border.light
                          }}
                        >
                          {[
                            { id: 'ALL', label: t('admin.users.filterAll') || 'All Statuses', badgeClass: 'bg-gray-500/10 text-gray-400' },
                            { id: 'ACTIVE', label: t('admin.users.filterActive') || 'Active', badgeClass: 'bg-emerald-500/10 text-emerald-500' },
                            { id: 'PENDING', label: t('admin.users.filterPending') || 'Pending', badgeClass: 'bg-amber-500/10 text-amber-500' },
                            { id: 'SUSPENDED', label: t('admin.users.filterSuspended') || 'Suspended', badgeClass: 'bg-red-500/10 text-red-500' }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setUserStatusFilter(item.id as any);
                                setIsFilterDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors hover:cursor-pointer"
                              style={{
                                color: userStatusFilter === item.id ? colors.interactive.primary : colors.text.primary,
                                backgroundColor: userStatusFilter === item.id ? `${colors.interactive.primary}10` : 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                if (userStatusFilter !== item.id) e.currentTarget.style.backgroundColor = `${colors.interactive.primary}08`;
                              }}
                              onMouseLeave={(e) => {
                                if (userStatusFilter !== item.id) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <span>{item.label}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeClass}`}>
                                {item.id}
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Users Data Table */}
              <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: colors.border.light }}>
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead style={{ backgroundColor: colors.background.secondary, color: colors.text.secondary }}>
                    <tr>
                      <th className="p-4">{t('admin.users.colUser')}</th>
                      <th className="p-4">{t('admin.users.colRole')}</th>
                      <th className="p-4">{t('admin.users.colFinancial')}</th>
                      <th className="p-4">{t('admin.users.colStatus')}</th>
                      <th className="p-4">Joined Date</th>
                      <th className="p-4 text-right">{t('admin.users.colActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: colors.border.light }}>
                    {isLoadingData ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i}>
                          <td className="p-4 space-y-1.5">
                            <Skeleton variant="text" width="120px" height="1rem" />
                            <Skeleton variant="text" width="160px" height="0.75rem" />
                          </td>
                          <td className="p-4">
                            <Skeleton variant="rectangular" width="60px" height="1.5rem" />
                          </td>
                          <td className="p-4">
                            <Skeleton variant="rectangular" width="90px" height="1.5rem" />
                          </td>
                          <td className="p-4">
                            <Skeleton variant="rectangular" width="70px" height="1.5rem" />
                          </td>
                          <td className="p-4">
                            <Skeleton variant="text" width="90px" height="0.9rem" />
                          </td>
                          <td className="p-4 text-right">
                            <Skeleton variant="rectangular" width="80px" height="2rem" style={{ marginLeft: 'auto' }} />
                          </td>
                        </tr>
                      ))
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((usr) => (
                        <tr key={usr.id} className="hover:opacity-90 transition-opacity">
                          <td className="p-4">
                            <div className="font-bold text-xs sm:text-sm" style={{ color: colors.text.primary }}>{usr.name || usr.fullName || 'User'}</div>
                            <div style={{ color: colors.text.secondary }} className="text-[11px] font-mono mt-0.5">{usr.email || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${usr.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : usr.role === 'MANAGER' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              }`}>
                              {usr.role || 'USER'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${(usr.financialSetup || usr.financialSetupCompleted) ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}>
                              {(usr.financialSetup || usr.financialSetupCompleted) ? t('admin.users.setupCompleted') : t('admin.users.setupPending')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${usr.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : usr.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                              {usr.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs" style={{ color: colors.text.secondary }}>{usr.joinedDate || usr.createdAt || 'N/A'}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => toggleUserStatus(usr.id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-xl border transition-all hover:scale-105"
                              style={{
                                borderColor: usr.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                                color: usr.status === 'ACTIVE' ? '#EF4444' : '#10B981',
                                backgroundColor: usr.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)'
                              }}
                            >
                              {usr.status === 'ACTIVE' ? t('admin.users.btnSuspend') : t('admin.users.btnActivate')}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center" style={{ color: colors.text.secondary }}>
                          <Text className="text-xs">{t('common.noData') || 'No users found'}</Text>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: BROADCAST SYSTEM & REAL NOTIFICATIONS HISTORY */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Send Broadcast Announcement Card */}
            <Card className="p-6 sm:p-7 border space-y-6" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
              <div className="border-b pb-5 mb-6" style={{ borderColor: colors.border.light }}>
                <Heading level={3} className="text-base sm:text-lg font-bold flex items-center gap-2.5 mb-1">
                  <MdCampaign className="w-6 h-6 text-indigo-500" />
                  {t('admin.broadcast.title')}
                </Heading>
                <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm block">
                  {t('admin.broadcast.subtitle')}
                </Text>
              </div>

              {broadcastSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-xs sm:text-sm font-semibold mb-4">
                  <MdCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>{t('admin.broadcast.sentSuccess')}</span>
                </div>
              )}

              <form onSubmit={handleSendBroadcast} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold block" style={{ color: colors.text.secondary }}>
                      {t('admin.broadcast.subject')}
                    </label>
                    <Input
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Scheduled System Maintenance Notice"
                      required
                      className="w-full text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold block" style={{ color: colors.text.secondary }}>
                      {t('admin.broadcast.severity')}
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {(['INFO', 'WARNING', 'URGENT'] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setBroadcastSeverity(sev)}
                          className={`flex-1 py-2 text-[11px] font-bold rounded-xl border transition-all hover:cursor-pointer ${broadcastSeverity === sev
                            ? sev === 'URGENT'
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : sev === 'WARNING'
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                : 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                            : 'bg-transparent border-gray-700/30 text-gray-400 opacity-60'
                            }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold block" style={{ color: colors.text.secondary }}>
                    {t('admin.broadcast.message')}
                  </label>
                  <textarea
                    rows={3}
                    value={broadcastMsg}
                    onChange={(e) => setBroadcastMsg(e.target.value)}
                    placeholder="Enter full broadcast details to be delivered to user notification feeds..."
                    required
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border outline-none transition-all resize-none"
                    style={{
                      borderColor: colors.border.light,
                      backgroundColor: colors.background.secondary,
                      color: colors.text.primary
                    }}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isBroadcasting || !broadcastTitle || !broadcastMsg}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-lg"
                  >
                    <MdSend className="w-4 h-4" />
                    <span>{isBroadcasting ? t('admin.broadcast.broadcasting') : t('admin.broadcast.send')}</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Broadcast History & Admin Notifications Logs */}
            <Card className="p-6 sm:p-7 border space-y-6" style={{ borderColor: colors.border.light, backgroundColor: colors.surface.primary }}>
              <div className="flex items-center justify-between border-b pb-5 mb-6" style={{ borderColor: colors.border.light }}>
                <div className="space-y-1">
                  <Heading level={3} className="text-base sm:text-lg font-bold flex items-center gap-2.5">
                    <MdNotifications className="w-5 h-5 text-purple-400" />
                    {t('admin.broadcast.historyTitle')}
                  </Heading>
                  <Text style={{ color: colors.text.secondary }} className="text-xs sm:text-sm block">
                    {t('admin.broadcast.historySubtitle')}
                  </Text>
                </div>

                <Button
                  variant="secondary"
                  onClick={loadAdminNotifications}
                  disabled={isLoadingNotifications}
                  className="inline-flex items-center gap-2 text-xs py-2 px-3 font-semibold"
                >
                  <MdRefresh className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin' : ''}`} />
                  <span>{t('admin.broadcast.refreshBtn')}</span>
                </Button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {isLoadingNotifications ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl border space-y-2"
                        style={{ borderColor: colors.border.light, backgroundColor: colors.background.secondary }}
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton height={18} width={50} />
                          <Skeleton height={18} width="40%" />
                        </div>
                        <Skeleton height={14} width="80%" />
                      </div>
                    ))}
                  </div>
                ) : broadcastHistory.length > 0 ? (
                  broadcastHistory.map((notif: any) => {
                    const parsed = parseNotificationPayload(notif.content || '');
                    const sevStyle = parsed.severity === 'URGENT'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : parsed.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';

                    return (
                      <div
                        key={notif.id}
                        className="p-4.5 rounded-2xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-all"
                        style={{
                          borderColor: colors.border.light,
                          backgroundColor: colors.background.secondary
                        }}
                      >
                        <div className="flex-1 space-y-1.5 overflow-hidden">
                          {/* Header row with badge & title */}
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border flex-shrink-0 ${sevStyle}`}>
                              {parsed.severity}
                            </span>
                            <span className="text-sm sm:text-base font-sans font-black tracking-tight" style={{ color: colors.text.primary }}>
                              {parsed.title}
                            </span>
                          </div>

                          {/* Message row - sharp readable text */}
                          {parsed.message && (
                            <p className="text-xs sm:text-sm font-sans leading-relaxed block font-medium pt-0.5" style={{ color: colors.text.primary }}>
                              {parsed.message}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0 text-[11px] pt-1" style={{ color: colors.text.secondary }}>
                          <span>{notif.createdAt ? new Date(notif.createdAt).toLocaleString(locale) : 'Recently'}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center" style={{ color: colors.text.secondary }}>
                    <MdNotifications className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <Text className="text-xs block">{t('admin.broadcast.noHistory')}</Text>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
