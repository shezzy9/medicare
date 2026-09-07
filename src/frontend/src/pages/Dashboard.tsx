import { AppointmentStatus, TimeRange } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForAppointment,
} from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAppointments,
  useCallerPatientProfile,
  useLatestVitals,
  useNotifications,
  useVitalsHistory,
} from "@/hooks/useQueries";
import { formatDateTime, formatRelativeTime, timestampToDate } from "@/lib/api";
import type { Vital } from "@/lib/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  CalendarDays,
  Droplets,
  HeartPulse,
  Thermometer,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface Point {
  t: number;
  v: number;
}

function series(
  vitals: Vital[],
  pick: (v: Vital) => number | undefined,
): Point[] {
  return vitals
    .map((v) => {
      const val = pick(v);
      const t = timestampToDate(v.recordedAt);
      return val !== undefined && t ? { t: t.getTime(), v: val } : null;
    })
    .filter((x): x is Point => x !== null)
    .sort((a, b) => a.t - b.t);
}

function Sparkline({
  data,
  color,
  id,
}: { data: Point[]; color: string; id: string }) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${id})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function MetricSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-28" />
        <Skeleton className="mt-4 h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { identity } = useInternetIdentity();
  const patientId = identity?.getPrincipal() ?? Principal.anonymous();

  const profileQuery = useCallerPatientProfile();
  const latestQuery = useLatestVitals(patientId);
  const historyQuery = useVitalsHistory(patientId, TimeRange.d7);
  const appointmentsQuery = useAppointments(patientId);
  const notificationsQuery = useNotifications();

  const loading =
    latestQuery.isLoading ||
    historyQuery.isLoading ||
    appointmentsQuery.isLoading ||
    notificationsQuery.isLoading;

  const latest = latestQuery.data;
  const vitals = historyQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const notifications = notificationsQuery.data ?? [];

  const upcoming = appointments
    .filter((a) => a.status === AppointmentStatus.scheduled)
    .sort((a, b) => Number(a.date - b.date))
    .find((a) => {
      const d = timestampToDate(a.date);
      return d ? d.getTime() >= Date.now() - 86_400_000 : false;
    });

  const recentNotifications = [...notifications]
    .sort((a, b) => Number(b.createdAt - a.createdAt))
    .slice(0, 4);

  const name = profileQuery.data?.name ?? "there";

  const hrSeries = series(vitals, (v) =>
    v.heartRate !== undefined ? Number(v.heartRate) : undefined,
  );
  const bpSeries = series(vitals, (v) =>
    v.systolicBP !== undefined ? Number(v.systolicBP) : undefined,
  );
  const sugarSeries = series(vitals, (v) =>
    v.bloodSugar !== undefined ? v.bloodSugar : undefined,
  );
  const tempSeries = series(vitals, (v) =>
    v.temperature !== undefined ? v.temperature : undefined,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${name}`}
        description="Here's a snapshot of your health today."
      />

      {/* Vitals summary cards */}
      <div
        data-ocid="dashboard.vitals_cards"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              label="Heart Rate"
              value={
                latest?.heartRate !== undefined ? String(latest.heartRate) : "—"
              }
              unit="bpm"
              icon={<HeartPulse className="h-5 w-5" />}
              trend={
                hrSeries.length > 1
                  ? `${hrSeries.length} readings`
                  : "No trend yet"
              }
              trendTone="neutral"
              sparkline={
                <Sparkline data={hrSeries} color="var(--chart-1)" id="hr" />
              }
            />
            <MetricCard
              label="Blood Pressure"
              value={
                latest?.systolicBP !== undefined &&
                latest?.diastolicBP !== undefined
                  ? `${latest.systolicBP}/${latest.diastolicBP}`
                  : "—"
              }
              unit="mmHg"
              icon={<Activity className="h-5 w-5" />}
              trend={
                bpSeries.length > 1
                  ? `${bpSeries.length} readings`
                  : "No trend yet"
              }
              trendTone="neutral"
              sparkline={
                <Sparkline data={bpSeries} color="var(--chart-2)" id="bp" />
              }
            />
            <MetricCard
              label="Blood Sugar"
              value={
                latest?.bloodSugar !== undefined
                  ? String(latest.bloodSugar)
                  : "—"
              }
              unit="mg/dL"
              icon={<Droplets className="h-5 w-5" />}
              trend={
                sugarSeries.length > 1
                  ? `${sugarSeries.length} readings`
                  : "No trend yet"
              }
              trendTone="neutral"
              sparkline={
                <Sparkline
                  data={sugarSeries}
                  color="var(--chart-4)"
                  id="sugar"
                />
              }
            />
            <MetricCard
              label="Temperature"
              value={
                latest?.temperature !== undefined
                  ? String(latest.temperature)
                  : "—"
              }
              unit="°C"
              icon={<Thermometer className="h-5 w-5" />}
              trend={
                tempSeries.length > 1
                  ? `${tempSeries.length} readings`
                  : "No trend yet"
              }
              trendTone="neutral"
              sparkline={
                <Sparkline data={tempSeries} color="var(--chart-3)" id="temp" />
              }
            />
          </>
        )}
      </div>

      {/* Upcoming appointment + recent notifications */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card data-ocid="dashboard.upcoming_appointment">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Upcoming appointment
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/appointments">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {appointmentsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
              </div>
            ) : upcoming ? (
              <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-foreground">
                    {upcoming.reason || "Follow-up visit"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(upcoming.date)} · {upcoming.time}
                  </p>
                </div>
                <StatusBadge
                  label={upcoming.status}
                  tone={statusToneForAppointment(upcoming.status)}
                />
              </div>
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-6 w-6" />}
                title="No upcoming appointments"
                description="Book an appointment with your doctor to get started."
                action={
                  <Button type="button" asChild>
                    <Link to="/appointments">Book appointment</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card data-ocid="dashboard.recent_notifications">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Recent notifications
            </CardTitle>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/notifications">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {notificationsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentNotifications.length > 0 ? (
              <ul className="space-y-3">
                {recentNotifications.map((n) => (
                  <li
                    key={n.id.toString()}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                        n.isRead ? "bg-muted-foreground/40" : "bg-primary"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Bell className="h-6 w-6" />}
                title="No notifications yet"
                description="Updates about your appointments and health will appear here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
