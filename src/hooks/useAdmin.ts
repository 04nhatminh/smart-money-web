import { useState, useCallback } from 'react';
import { adminService, SettlementRunResponse, SystemStats, AdminUserItem } from '@/services/admin';

export interface SettlementLog {
  id: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  triggeredBy: string;
  durationMs: number;
}

export function useAdmin() {
  const [isSettlementRunning, setIsSettlementRunning] = useState(false);
  const [settlementResult, setSettlementResult] = useState<SettlementRunResponse | null>(null);
  const [settlementHistory, setSettlementHistory] = useState<SettlementLog[]>([
    {
      id: 'settle-log-1',
      timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
      status: 'SUCCESS',
      message: 'Automated monthly settlement completed for 38 active projects.',
      triggeredBy: 'SYSTEM_SCHEDULER',
      durationMs: 1420
    }
  ]);

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const runSettlement = useCallback(async () => {
    setIsSettlementRunning(true);
    setSettlementResult(null);
    const startTime = Date.now();

    try {
      const res = await adminService.runMonthlySettlement();
      const endTime = Date.now();
      setSettlementResult(res);

      const newLog: SettlementLog = {
        id: `settle-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: res.success ? 'SUCCESS' : 'FAILED',
        message: res.message || (res.success ? 'Settlement completed successfully' : 'Settlement failed'),
        triggeredBy: 'ADMIN_MANUAL_TRIGGER',
        durationMs: endTime - startTime
      };

      setSettlementHistory(prev => [newLog, ...prev]);
      return res;
    } catch (err: any) {
      const endTime = Date.now();
      const errRes: SettlementRunResponse = {
        success: false,
        message: err?.message || 'Failed to trigger settlement.'
      };
      setSettlementResult(errRes);

      const newLog: SettlementLog = {
        id: `settle-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'FAILED',
        message: errRes.message,
        triggeredBy: 'ADMIN_MANUAL_TRIGGER',
        durationMs: endTime - startTime
      };

      setSettlementHistory(prev => [newLog, ...prev]);
      return errRes;
    } finally {
      setIsSettlementRunning(false);
    }
  }, []);

  const sendBroadcast = useCallback(async (title: string, message: string, severity: 'INFO' | 'WARNING' | 'URGENT') => {
    setIsBroadcasting(true);
    setBroadcastStatus(null);
    try {
      const res = await adminService.broadcastNotification(title, message, severity);
      setBroadcastStatus(res);
      return res;
    } catch (err: any) {
      const errRes = { success: false, message: err?.message || 'Failed to broadcast' };
      setBroadcastStatus(errRes);
      return errRes;
    } finally {
      setIsBroadcasting(false);
    }
  }, []);

  return {
    isSettlementRunning,
    settlementResult,
    settlementHistory,
    runSettlement,
    isBroadcasting,
    broadcastStatus,
    sendBroadcast
  };
}
