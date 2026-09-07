import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useQueries";
import { formatRelativeTime } from "@/lib/api";
import type { NotificationKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  FileText,
  HeartPulse,
  Loader2,
  Pill,
  Stethoscope,
  TriangleAlert,
  Watch,
} from "lucide-react";

const kindIcon: Record<NotificationKind, typeof Bell> = {
  appointment: CalendarDays,
  prescription: Pill,
  vital: HeartPulse,
  device: Watch,
  medicalHistory: FileText,
  systemNotification: Bell,
  consultation: Stethoscope,
};

export function NotificationsPage() {
  const notificationsQuery = useNotifications();
  const unreadQuery = useUnreadNotificationCount();
  const markAsRead = useMarkNotificationAsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data ?? [];
  const unread = unreadQuery.data ?? 0n;
  const hasUnread = unread > 0n;

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with alerts about your health."
        actions={
          hasUnread ? (
            <Button
              type="button"
              variant="outline"
              data-ocid="mark_all_read_button"
              disabled={markAllRead.isPending}
              onClick={handleMarkAll}
            >
              {markAllRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all as read
            </Button>
          ) : null
        }
      />

      {notificationsQuery.isLoading ? (
        <div className="space-y-3" data-ocid="loading_state">
          {Array.from({ length: 5 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : notificationsQuery.isError ? (
        <Card data-ocid="error_state">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                Couldn&apos;t load your notifications
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Something went wrong while fetching your notifications. Please
                try again.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              data-ocid="retry_button"
              onClick={() => void notificationsQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<BellRing className="h-6 w-6" />}
          title="No notifications"
          description="You're all caught up. New alerts about your health will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = kindIcon[notification.kind] ?? Bell;
            return (
              <Card
                key={notification.id.toString()}
                data-ocid={`notification.item.${notification.id.toString()}`}
                className={cn(
                  "transition-smooth hover:shadow-subtle",
                  !notification.isRead && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <CardHeader className="flex-row items-start gap-3 space-y-0">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      notification.isRead
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <span className="truncate">{notification.title}</span>
                        {!notification.isRead ? (
                          <span
                            data-ocid="unread_dot"
                            className="h-2 w-2 shrink-0 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        ) : null}
                      </CardTitle>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <CardDescription className="text-sm">
                      {notification.message}
                    </CardDescription>
                  </div>
                </CardHeader>
                {!notification.isRead ? (
                  <CardContent className="pt-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      data-ocid={`mark_read_button.${notification.id.toString()}`}
                      disabled={markAsRead.isPending}
                      onClick={() => markAsRead.mutate(notification.id)}
                      className="text-primary hover:text-primary"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark as read
                    </Button>
                  </CardContent>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
