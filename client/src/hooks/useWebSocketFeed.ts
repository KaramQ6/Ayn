import { useEffect, useState } from 'react';
import { WS_URL } from '../lib/api';
import type { WsMessage } from '../types';

type FeedItem = {
  id: string;
  receivedAt: string;
  message: WsMessage;
};

export function useWebSocketFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'closed'>('connecting');

  useEffect(() => {
    let reconnectTimer: number | undefined;
    let closedByEffect = false;
    let socket: WebSocket | null = null;

    const connect = () => {
      setStatus('connecting');
      socket = new WebSocket(WS_URL);

      socket.addEventListener('open', () => setStatus('connected'));
      socket.addEventListener('message', event => {
        try {
          const message = JSON.parse(event.data) as WsMessage;
          setItems(current => [
            {
              id: `${Date.now()}-${Math.random()}`,
              receivedAt: new Date().toISOString(),
              message,
            },
            ...current,
          ].slice(0, 30));
        } catch {
          setItems(current => [
            {
              id: `${Date.now()}-${Math.random()}`,
              receivedAt: new Date().toISOString(),
              message: { type: 'unreadable' },
            },
            ...current,
          ].slice(0, 30));
        }
      });
      socket.addEventListener('close', () => {
        setStatus('closed');
        if (!closedByEffect) {
          reconnectTimer = window.setTimeout(connect, 2500);
        }
      });
      socket.addEventListener('error', () => setStatus('closed'));
    };

    connect();

    return () => {
      closedByEffect = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  return { items, status };
}
