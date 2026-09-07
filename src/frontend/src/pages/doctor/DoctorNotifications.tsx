import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useQueries";
import { formatRelativeTime } from "@/lib/api";
import { NotificationKind } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  BellOff,
  CalendarDays,
  CheckCheck,
  FileText,
  type LucideIcon,
  Pill,
  Settings2,
  Stethoscope,
} from "lucide-react";

const kindMeta: Record<NotificationKind, { icon: LucideIcon; label: string }> =
  {
    [NotificationKind.appointment]: {
      icon: CalendarDays,
      label: "Appointment",
    },
    [NotificationKind.prescription]: { icon: Pill, label: "Prescription" },
    [NotificationKind.vital]: { icon: Activity, label: "Vitals" },
    [NotificationKind.device]: { icon: Settings2, label: "Device" },
    [NotificationKind.medicalHistory]: {
      icon: FileText,
      label: "Medical history",
    },
    [NotificationKind.systemNotification]: { icon: Bell, label: "System" },
    [NotificationKind.consultation]: {
      icon: Stethoscope,
      label: "Consultation",
    },
  };

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
        <Card key={id} className="gap-0 p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function DoctorNotificationsPage() {
  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markRead = useMarkNotificationAsRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = Number(unreadCount ?? 0n);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay up to date with alerts about your patients."
        actions={
          <Button
            type="button"
            variant="outline"
            data-ocid="mark_all_read_button"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      {isLoading ? (
        <NotificationSkeleton />
      ) : isError ? (
        <Card className="gap-0 p-6">
          <div
            data-ocid="error_state"
            className="flex flex-col items-center justify-center py-10 text-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <BellOff className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-semibold text-foreground">
              Couldn&apos;t load notifications
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Something went wrong while fetching your notifications. Please try
              again.
            </p>
            <Button
              type="button"
              variant="outline"
              data-ocid="retry_button"
              className="mt-5"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        </Card>
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications yet"
          description="When there's an update about your patients, appointments, or prescriptions, it will show up here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => {
            const meta = kindMeta[notification.kind] ?? {
              icon: Bell,
              label: "Notification",
            };
            const Icon = meta.icon;
            return (
              <Card
                key={notification.id.toString()}
                data-ocid={`notification.item.${index + 1}`}
                className={cn(
                  "gap-0 p-4 transition-smooth",
                  !notification.isRead && "border-primary/30 bg-primary/[0.03]",
                )}
              >
                <div className="flex items-start gap-3">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold text-foreground",
                            !notification.isRead && "text-primary",
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {meta.label} ·{" "}
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          data-ocid={`notification.mark_read.${index + 1}`}
                          disabled={markRead.isPending}
                          onClick={() => markRead.mutate(notification.id)}
                          className="shrink-0 text-muted-foreground hover:text-primary"
                        >
                          <CheckCheck className="h-4 w-4" />
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
