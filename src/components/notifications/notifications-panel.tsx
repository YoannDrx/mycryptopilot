/**
 * Notifications Panel Component
 *
 * Displays real-time notifications for portfolio, trades, and signals.
 */

"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellOff,
  TrendingUp,
  Copy,
  Activity,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";

export function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  // Get icon for notification type
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "trade":
        return <TrendingUp className="h-4 w-4" />;
      case "copy":
        return <Copy className="h-4 w-4" />;
      case "portfolio":
        return <Activity className="h-4 w-4" />;
      case "signal":
        return <TrendingUp className="h-4 w-4" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get color for notification type
  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "trade":
        return "text-blue-500 bg-blue-500/10";
      case "copy":
        return "text-purple-500 bg-purple-500/10";
      case "portfolio":
        return "text-green-500 bg-green-500/10";
      case "signal":
        return "text-orange-500 bg-orange-500/10";
      case "alert":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {notifications.length === 0 ? (
            <BellOff className="h-5 w-5" />
          ) : (
            <>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8"
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="text-muted-foreground/50 mb-2 h-12 w-12" />
              <p className="text-muted-foreground text-sm">
                No notifications yet
              </p>
              <p className="text-muted-foreground text-xs">
                You'll be notified about trades, signals, and alerts
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "group hover:bg-muted/50 relative cursor-pointer p-4 transition-colors",
                    !notification.read && "bg-muted/30",
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        getNotificationColor(notification.type),
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-none font-medium">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {notification.message}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                onClick={() => setIsOpen(false)}
              >
                Close
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Notification Badge Component
 *
 * Simple badge showing unread notification count
 */
export function NotificationBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {unreadCount}
    </Badge>
  );
}
