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
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);

  // jobId -> subscription
  const subscriptionsRef = useRef<
    Map<
      string,
      {
        unsubscribe: () => void;
        callbacks: Set<(data: AIResultData) => void>;
      }
    >
  >(new Map());

  // queue subscribe khi chưa connect
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

      // 🔥 flush pending subscriptions
      pendingSubscriptionsRef.current.forEach((callbacks, jobId) => {
        callbacks.forEach((cb) => {
          internalSubscribe(jobId, cb);
        });
      });

      pendingSubscriptionsRef.current.clear();
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

      subscriptionsRef.current.forEach(({ unsubscribe }) => {
        try {
          unsubscribe();
        } catch {}
      });

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
    const client = clientRef.current;
    if (!client || !client.connected) return;

    const topic = `/topic/ai/${jobId}`;

    let subscription = subscriptionsRef.current.get(jobId);

    if (!subscription) {
      console.log(`📌 Subscribing to: ${topic}`);

      const stompSub = client.subscribe(topic, (message: IMessage) => {
        try {
          const data = JSON.parse(message.body);

          const subs = subscriptionsRef.current.get(jobId);
          subs?.callbacks.forEach((cb) => cb(data));
        } catch (err) {
          console.error(`❌ Parse error [${jobId}]`, err);
        }
      });

      subscription = {
        unsubscribe: () => stompSub.unsubscribe(),
        callbacks: new Set(),
      };

      subscriptionsRef.current.set(jobId, subscription);
    }

    subscription.callbacks.add(onMessage);
  };

  // ===== PUBLIC SUBSCRIBE =====
  const subscribe = useCallback(
    (jobId: string, onMessage: (data: AIResultData) => void) => {
      const client = clientRef.current;

      // chưa connect → đưa vào queue
      if (!client || !client.connected) {
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
            console.log(`📌 Unsubscribing from: ${jobId}`);
            subs.unsubscribe();
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
    []
  );

  // ===== FORCE UNSUBSCRIBE =====
  const unsubscribe = useCallback((jobId: string) => {
    const subs = subscriptionsRef.current.get(jobId);
    if (subs) {
      subs.unsubscribe();
      subscriptionsRef.current.delete(jobId);
    }

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