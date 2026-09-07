import { createActor } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForAppointment,
} from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAssignedPatients,
  useCallerDoctorProfile,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/useQueries";
import { formatDate, formatRelativeTime, shortPrincipal } from "@/lib/api";
import {
  type Appointment,
  AppointmentStatus,
  type Consultation,
} from "@/lib/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  HeartPulse,
  Stethoscope,
  Users,
} from "lucide-react";
import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

function Sparkline({ data }: { data: number[] }) {
  const gradientId = useId();
  const points = data.map((value, index) => ({ index, value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={points}
        margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function bucketCounts(timestamps: bigint[], buckets = 8): number[] {
  if (timestamps.length === 0) return Array.from({ length: buckets }, () => 0);
  const dates = timestamps
    .map((t) => Number(t / 1_000_000n))
    .filter((n) => !Number.isNaN(n));
  if (dates.length === 0) return Array.from({ length: buckets }, () => 0);
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  const span = Math.max(max - min, 1);
  const counts = Array.from({ length: buckets }, () => 0);
  for (const d of dates) {
    const idx = Math.min(buckets - 1, Math.floor(((d - min) / span) * buckets));
    counts[idx] += 1;
  }
  return counts;
}

export function DoctorDashboardPage() {
  const { actor, isFetching } = useActor(createActor);
  const { data: doctorProfile, isLoading: profileLoading } =
    useCallerDoctorProfile();
  const doctorId = doctorProfile?.userId ?? null;
  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    isError: assignmentsError,
  } = useAssignedPatients(doctorId);
  const { data: notifications = [], isLoading: notificationsLoading } =
    useNotifications();
  const { data: unreadCount = 0n } = useUnreadNotificationCount();

  const patientIds = assignments.map((a) => a.patientId);

  const appointmentQueries = useQueries({
    queries: patientIds.map((pid) => ({
      queryKey: ["appointments", pid],
      queryFn: async (): Promise<Appointment[]> => {
        if (!actor) return [];
        return actor.listAppointments(pid);
      },
      enabled: !!actor && !isFetching && !!pid,
    })),
  });

  const consultationQueries = useQueries({
    queries: patientIds.map((pid) => ({
      queryKey: ["consultations", pid],
      queryFn: async (): Promise<Consultation[]> => {
        if (!actor) return [];
        return actor.listConsultations(pid);
      },
      enabled: !!actor && !isFetching && !!pid,
    })),
  });

  const allAppointments = appointmentQueries.flatMap((q) => q.data ?? []);
  const allConsultations = consultationQueries.flatMap((q) => q.data ?? []);

  const upcomingAppointments = allAppointments
    .filter((a) => a.status === AppointmentStatus.scheduled)
    .sort((a, b) => Number(a.date - b.date));

  const recentConsultations = [...allConsultations]
    .sort((a, b) => Number(b.date - a.date))
    .slice(0, 5);

  const recentNotifications = [...notifications]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 5);

  const loading =
    profileLoading ||
    assignmentsLoading ||
    notificationsLoading ||
    appointmentQueries.some((q) => q.isLoading) ||
    consultationQueries.some((q) => q.isLoading);

  const assignedSpark = bucketCounts(assignments.map((a) => a.assignedAt));
  const appointmentSpark = bucketCounts(allAppointments.map((a) => a.date));
  const consultationSpark = bucketCounts(allConsultations.map((c) => c.date));
  const notificationSpark = bucketCounts(notifications.map((n) => n.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Dashboard"
        description={
          doctorProfile
            ? `Welcome back, Dr. ${doctorProfile.name} — here's your practice at a glance.`
            : "Overview of your patients, consultations and appointments."
        }
        actions={
          <Button asChild data-ocid="view_patients_button">
            <Link to="/doctor/patients">
              <Users className="mr-2 h-4 w-4" /> View patients
            </Link>
          </Button>
        }
      />

      {assignmentsError ? (
        <div
          data-ocid="error_state"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center"
        >
          <p className="font-medium text-destructive">
            We couldn't load your patient list.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again in a moment.
          </p>
        </div>
      ) : null}

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Assigned Patients"
          value={loading ? "—" : String(assignments.length)}
          icon={<Users className="h-5 w-5" />}
          trend={`${assignments.length} under your care`}
          sparkline={<Sparkline data={assignedSpark} />}
        />
        <MetricCard
          label="Upcoming Appointments"
          value={loading ? "—" : String(upcomingAppointments.length)}
          icon={<CalendarDays className="h-5 w-5" />}
          trend="Scheduled visits"
          sparkline={<Sparkline data={appointmentSpark} />}
        />
        <MetricCard
          label="Recent Consultations"
          value={loading ? "—" : String(allConsultations.length)}
          icon={<Stethoscope className="h-5 w-5" />}
          trend="All-time consultations"
          sparkline={<Sparkline data={consultationSpark} />}
        />
        <MetricCard
          label="Unread Notifications"
          value={loading ? "—" : String(unreadCount)}
          icon={<Bell className="h-5 w-5" />}
          trend="Awaiting your attention"
          sparkline={<Sparkline data={notificationSpark} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming appointments */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming Appointments
            </CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-ocid="appointments_link"
            >
              <Link to="/doctor/appointments">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
                  <Skeleton key={id} className="h-14 w-full" />
                ))}
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title="No upcoming appointments"
                description="Scheduled visits with your patients will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {upcomingAppointments.slice(0, 4).map((appt) => (
                  <li
                    key={appt.id.toString()}
                    data-ocid={`appointment.item.${appt.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {appt.reason || "Consultation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(appt.date)} · {appt.time}
                      </p>
                    </div>
                    <StatusBadge
                      label={appt.status}
                      tone={statusToneForAppointment(appt.status)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent consultations */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4 text-primary" />
              Recent Consultations
            </CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-ocid="consultations_link"
            >
              <Link to="/doctor/consultations">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
                  <Skeleton key={id} className="h-14 w-full" />
                ))}
              </div>
            ) : recentConsultations.length === 0 ? (
              <EmptyState
                icon={<Stethoscope className="h-6 w-6" />}
                title="No consultations yet"
                description="Consultations you record for patients will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {recentConsultations.map((c) => (
                  <li
                    key={c.id.toString()}
                    data-ocid={`consultation.item.${c.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.reason || "Consultation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.date)} ·{" "}
                        {shortPrincipal(c.patientId.toString())}
                      </p>
                    </div>
                    <StatusBadge
                      label={c.status}
                      tone={c.status === "open" ? "info" : "neutral"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </CardTitle>
            <Button
              asChild
              variant="ghost"
              size="sm"
              data-ocid="notifications_link"
            >
              <Link to="/doctor/notifications">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
                  <Skeleton key={id} className="h-14 w-full" />
                ))}
              </div>
            ) : recentNotifications.length === 0 ? (
              <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title="No notifications"
                description="Updates about your patients will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((n) => (
                  <li
                    key={n.id.toString()}
                    data-ocid={`notification.item.${n.id}`}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bell className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
