import { useState, useEffect, useCallback, useRef } from 'react';

export interface AlertItem {
  id: number;
  asset_id: string;
  alert_type: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  is_read: number;
  created_at: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts?unread_only=false&limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // Backend may not be running — silently ignore
    }
  }, []);

  const markRead = useCallback(async (ids: number[]) => {
    try {
      await fetch('/api/alerts/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ids),
      });
      setAlerts((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, is_read: 1 } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - ids.length));
    } catch {
      // ignore
    }
  }, []);

  // WebSocket for live push alerts
  useEffect(() => {
    fetchAlerts();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${window.location.host}/ws/alerts`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'alert') {
            const newAlert: AlertItem = {
              id: payload.id,
              asset_id: payload.asset_id,
              alert_type: payload.alert_type,
              message: payload.message,
              severity: payload.severity,
              is_read: 0,
              created_at: payload.created_at,
            };
            setAlerts((prev) => [newAlert, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        } catch {
          // ignore parse errors
        }
      };

      // Send heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30_000);

      return () => {
        clearInterval(heartbeat);
        ws.close();
      };
    } catch {
      // WS not available — fall back to polling
      const poll = setInterval(fetchAlerts, 30_000);
      return () => clearInterval(poll);
    }
  }, [fetchAlerts]);

  return { alerts, unreadCount, fetchAlerts, markRead };
}
