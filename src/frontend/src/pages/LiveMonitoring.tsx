import { DeviceStatus, VitalSource } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceStatus, useLatestVitals } from "@/hooks/useQueries";
import { formatDateTime, formatRelativeTime } from "@/lib/api";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Droplets,
  HeartPulse,
  Radio,
  Thermometer,
  WifiOff,
} from "lucide-react";

interface Reading {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  status: "normal" | "attention" | "unavailable";
  statusLabel: string;
  recordedAt?: bigint;
}

function ReadingCard({ reading }: { reading: Reading }) {
  return (
    <Card
      data-ocid={`live.${reading.label.toLowerCase().replaceAll(" ", "_")}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {reading.icon}
          </div>
          <StatusBadge
            label={reading.statusLabel}
            tone={
              reading.status === "normal"
                ? "success"
                : reading.status === "attention"
                  ? "warning"
                  : "neutral"
            }
          />
        </div>
        <p className="mt-4 text-sm font-medium text-muted-foreground">
          {reading.label}
        </p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground">
          {reading.value}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {reading.unit}
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {reading.recordedAt !== undefined
            ? `Updated ${formatRelativeTime(reading.recordedAt)}`
            : "No reading recorded"}
        </p>
      </CardContent>
    </Card>
  );
}

export function LiveMonitoringPage() {
  const { identity } = useInternetIdentity();
  const patientId = identity?.getPrincipal() ?? Principal.anonymous();

  const latestQuery = useLatestVitals(patientId);
  const deviceQuery = useDeviceStatus(patientId);

  const loading = latestQuery.isLoading || deviceQuery.isLoading;
  const latest = latestQuery.data;
  const device = deviceQuery.data;

  const deviceOnline = device != null && device.status === DeviceStatus.active;

  const readings: Reading[] = [
    {
      label: "Heart Rate",
      value: latest?.heartRate !== undefined ? String(latest.heartRate) : "—",
      unit: "bpm",
      icon: <HeartPulse className="h-5 w-5" />,
      status:
        latest?.heartRate === undefined
          ? "unavailable"
          : latest.heartRate >= 60n && latest.heartRate <= 100n
            ? "normal"
            : "attention",
      statusLabel:
        latest?.heartRate === undefined
          ? "No reading"
          : latest.heartRate >= 60n && latest.heartRate <= 100n
            ? "Normal"
            : "Attention",
      recordedAt: latest?.recordedAt,
    },
    {
      label: "SpO₂",
      value: latest?.spo2 !== undefined ? String(latest.spo2) : "—",
      unit: "%",
      icon: <Droplets className="h-5 w-5" />,
      status:
        latest?.spo2 === undefined
          ? "unavailable"
          : latest.spo2 >= 95n
            ? "normal"
            : "attention",
      statusLabel:
        latest?.spo2 === undefined
          ? "No reading"
          : latest.spo2 >= 95n
            ? "Normal"
            : "Attention",
      recordedAt: latest?.recordedAt,
    },
    {
      label: "Temperature",
      value:
        latest?.temperature !== undefined ? String(latest.temperature) : "—",
      unit: "°C",
      icon: <Thermometer className="h-5 w-5" />,
      status:
        latest?.temperature === undefined
          ? "unavailable"
          : latest.temperature >= 36.1 && latest.temperature <= 37.2
            ? "normal"
            : "attention",
      statusLabel:
        latest?.temperature === undefined
          ? "No reading"
          : latest.temperature >= 36.1 && latest.temperature <= 37.2
            ? "Normal"
            : "Attention",
      recordedAt: latest?.recordedAt,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Monitoring"
        description="Real-time vitals from your connected health device."
      />

      {/* Device status banner */}
      {loading ? (
        <Card>
          <CardContent className="p-5">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </CardContent>
        </Card>
      ) : deviceOnline ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
              <Radio className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-foreground">
                {device?.deviceName ?? "Device"} connected
              </p>
              <p className="text-sm text-muted-foreground">
                {device?.lastSeenAt !== undefined
                  ? `Last seen ${formatDateTime(device.lastSeenAt)}`
                  : "Streaming live readings"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <WifiOff className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-foreground">
                Device unavailable
              </p>
              <p className="text-sm text-muted-foreground">
                No active device is streaming readings right now. Readings shown
                below are the most recent recorded values.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest readings */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      ) : latest === null ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title="No vitals recorded yet"
          description="Once your device streams readings, they'll appear here. You can also add a manual reading from My Vitals."
          action={
            <Link
              to="/my-vitals"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90"
            >
              Add manual reading
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {readings.map((r) => (
            <ReadingCard key={r.label} reading={r} />
          ))}
        </div>
      )}

      {/* Data source note */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            About live monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Readings are captured by your connected health device and stored
            securely in your MediCare+ record. Values shown here are the most
            recent readings received from your device.
          </p>
          <p>
            {latest?.source === VitalSource.manual
              ? "The latest reading was entered manually and is not a live sensor stream."
              : "Your device streams readings automatically when it's connected and active."}
          </p>
          <p>
            Browser-based Bluetooth Classic (HC-05) is not supported — connect
            your device through the supported companion app instead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
