/**
 * Notifications Hook
 *
 * Custom hook for managing real-time notifications.
 * Handles portfolio updates, copy trade alerts, and trade signals.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export type NotificationType =
  | "trade"
  | "copy"
  | "portfolio"
  | "signal"
  | "alert";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
};

type UseNotificationsReturn = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
};

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((n: Notification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(withDates);
      } catch {
        // Failed to parse notifications, start fresh
        localStorage.removeItem("notifications");
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Add a new notification
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Show toast for new notification
      toast.info(notification.title, {
        description: notification.message,
      });
    },
    [],
  );

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Clear a single notification
  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  };
}

/**
 * Hook for listening to portfolio updates
 */
export function usePortfolioNotifications() {
  const { addNotification } = useNotifications();

  const notifyTradeExecuted = useCallback(
    (trade: { symbol: string; side: string; pnl: number }) => {
      addNotification({
        type: "trade",
        title: "Trade Executed",
        message: `${trade.side} ${trade.symbol} - PnL: $${trade.pnl.toFixed(2)}`,
        data: { trade },
      });
    },
    [addNotification],
  );

  const notifyTradeClosed = useCallback(
    (trade: { symbol: string; pnl: number }) => {
      const isProfitable = trade.pnl > 0;
      addNotification({
        type: "trade",
        title: isProfitable ? "Profitable Trade Closed" : "Trade Closed",
        message: `${trade.symbol} closed with ${isProfitable ? "profit" : "loss"}: $${Math.abs(trade.pnl).toFixed(2)}`,
        data: { trade },
      });
    },
    [addNotification],
  );

  const notifyDrawdown = useCallback(
    (drawdown: number) => {
      addNotification({
        type: "alert",
        title: "Drawdown Alert",
        message: `Portfolio drawdown reached ${drawdown.toFixed(2)}%`,
        data: { drawdown },
      });
    },
    [addNotification],
  );

  return {
    notifyTradeExecuted,
    notifyTradeClosed,
    notifyDrawdown,
  };
}

/**
 * Hook for listening to copy trade updates
 */
export function useCopyTradeNotifications() {
  const { addNotification } = useNotifications();

  const notifyCopyTradeCreated = useCallback(
    (trade: { symbol: string; mode: string }) => {
      addNotification({
        type: "copy",
        title: "Copy Trade Created",
        message: `${trade.mode} copy trade for ${trade.symbol} created`,
        data: { trade },
      });
    },
    [addNotification],
  );

  const notifyCopyTradeExecuted = useCallback(
    (trade: { symbol: string; price: number }) => {
      addNotification({
        type: "copy",
        title: "Copy Trade Executed",
        message: `${trade.symbol} executed at $${trade.price.toFixed(2)}`,
        data: { trade },
      });
    },
    [addNotification],
  );

  const notifyCopyTradeFailed = useCallback(
    (trade: { symbol: string; reason: string }) => {
      addNotification({
        type: "alert",
        title: "Copy Trade Failed",
        message: `${trade.symbol}: ${trade.reason}`,
        data: { trade },
      });
    },
    [addNotification],
  );

  return {
    notifyCopyTradeCreated,
    notifyCopyTradeExecuted,
    notifyCopyTradeFailed,
  };
}

/**
 * Hook for listening to signal updates
 */
export function useSignalNotifications() {
  const { addNotification } = useNotifications();

  const notifyNewSignal = useCallback(
    (signal: { symbol: string; trader: string; side: string }) => {
      addNotification({
        type: "signal",
        title: "New Trading Signal",
        message: `${signal.trader}: ${signal.side} ${signal.symbol}`,
        data: { signal },
      });
    },
    [addNotification],
  );

  const notifySignalUpdate = useCallback(
    (signal: { symbol: string; status: string }) => {
      addNotification({
        type: "signal",
        title: "Signal Updated",
        message: `${signal.symbol} - ${signal.status}`,
        data: { signal },
      });
    },
    [addNotification],
  );

  return {
    notifyNewSignal,
    notifySignalUpdate,
  };
}
