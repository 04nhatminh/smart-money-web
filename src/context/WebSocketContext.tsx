'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

interface AIResultData {
  jobId: string;
  status: string;
  result?: Record<string, any>;
  error?: string;
  [key: string]: any;
}

interface WebSocketContextType {
  connected: boolean;
  subscribe: (
    jobId: string,
    onMessage: (data: AIResultData) => void
  ) => () => void;
  unsubscribe: (jobId: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const userSubRef = useRef<any>(null);

  // jobId -> subscription callbacks
  const subscriptionsRef = useRef<
    Map<
      string,
      {
        unsubscribe: () => void;
        callbacks: Set<(data: AIResultData) => void>;
      }
    >
  >(new Map());

  // queue subscribe khi chưa connect hoặc chưa có userId
  const pendingSubscriptionsRef = useRef<
    Map<string, Set<(data: AIResultData) => void>>
  >(new Map());

  const initializingRef = useRef(false);

  // ===== INIT CONNECTION =====
  useEffect(() => {
    if (initializingRef.current || clientRef.current?.active) return;
    initializingRef.current = true;

    const baseUrl =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      'http://localhost:8080/ws';

    const client = new Client({
      webSocketFactory: () => {
        console.log('🔗 Connecting via SockJS:', baseUrl);
        return new SockJS(baseUrl) as any;
      },

      reconnectDelay: 5000,

      // ✅ tránh bị server/nginx kill
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      debug: (str: string) => console.log('[WS DEBUG]', str),
    });

    // ===== ON CONNECT =====
    client.onConnect = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    };

    // ===== ON DISCONNECT =====
    client.onDisconnect = () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    };

    client.onStompError = (frame: any) => {
      console.error('⚠️ STOMP error:', frame);
    };

    client.onWebSocketError = (error: any) => {
      console.error('❌ WebSocket error:', error);
    };

    clientRef.current = client;
    client.activate();

    return () => {
      console.log('🔌 Cleaning up WebSocket');

      if (userSubRef.current) {
        try {
          userSubRef.current.unsubscribe();
        } catch {}
        userSubRef.current = null;
      }

      subscriptionsRef.current.clear();

      if (clientRef.current?.active) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  // ===== CORE SUBSCRIBE LOGIC =====
  const internalSubscribe = (
    jobId: string,
    onMessage: (data: AIResultData) => void
  ) => {
    let subscription = subscriptionsRef.current.get(jobId);

    if (!subscription) {
      subscription = {
        unsubscribe: () => {}, // No-op, handled by the single user topic subscription
        callbacks: new Set(),
      };
      subscriptionsRef.current.set(jobId, subscription);
    }

    subscription.callbacks.add(onMessage);
  };

  // ===== USER TOPIC SUBSCRIPTION =====
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !connected || !userId) {
      if (userSubRef.current) {
        console.log('🔌 Unsubscribing from user topic');
        try {
          userSubRef.current.unsubscribe();
        } catch (err) {
          console.error(err);
        }
        userSubRef.current = null;
      }
      return;
    }

    const topic = `/topic/ai/user/${userId}`;
    console.log(`📌 Subscribing to user topic: ${topic}`);

    try {
      const stompSub = client.subscribe(topic, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);
          const msgJobId = data.jobId;
          console.log(`✉️ Received WS message for job [${msgJobId}]`, data);

          if (msgJobId) {
            const subs = subscriptionsRef.current.get(msgJobId);
            subs?.callbacks.forEach((cb) => cb(data));
          }
        } catch (err) {
          console.error(`❌ Parse error on user topic`, err);
        }
      });

      userSubRef.current = stompSub;

      // flush pending subscriptions
      pendingSubscriptionsRef.current.forEach((callbacks, jobId) => {
        callbacks.forEach((cb) => {
          internalSubscribe(jobId, cb);
        });
      });
      pendingSubscriptionsRef.current.clear();

    } catch (err) {
      console.error('Failed to subscribe to user topic', err);
    }

    return () => {
      if (userSubRef.current) {
        console.log('🔌 Cleanup: Unsubscribing from user topic');
        try {
          userSubRef.current.unsubscribe();
        } catch (err) {
          console.error(err);
        }
        userSubRef.current = null;
      }
    };
  }, [connected, userId]);

  // ===== PUBLIC SUBSCRIBE =====
  const subscribe = useCallback(
    (jobId: string, onMessage: (data: AIResultData) => void) => {
      const client = clientRef.current;

      // chưa connect hoặc chưa có userId → đưa vào queue
      if (!client || !client.connected || !userId) {
        console.log(`⏳ Queue subscribe: ${jobId}`);

        let queue = pendingSubscriptionsRef.current.get(jobId);
        if (!queue) {
          queue = new Set();
          pendingSubscriptionsRef.current.set(jobId, queue);
        }

        queue.add(onMessage);
      } else {
        internalSubscribe(jobId, onMessage);
      }

      // unsubscribe function
      return () => {
        const subs = subscriptionsRef.current.get(jobId);

        if (subs) {
          subs.callbacks.delete(onMessage);

          if (subs.callbacks.size === 0) {
            console.log(`📌 Removing callback set for job: ${jobId}`);
            subscriptionsRef.current.delete(jobId);
          }
        }

        const pending = pendingSubscriptionsRef.current.get(jobId);
        if (pending) {
          pending.delete(onMessage);
          if (pending.size === 0) {
            pendingSubscriptionsRef.current.delete(jobId);
          }
        }
      };
    },
    [userId]
  );

  // ===== FORCE UNSUBSCRIBE =====
  const unsubscribe = useCallback((jobId: string) => {
    subscriptionsRef.current.delete(jobId);
    pendingSubscriptionsRef.current.delete(jobId);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// ===== HOOK =====
export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return ctx;
};