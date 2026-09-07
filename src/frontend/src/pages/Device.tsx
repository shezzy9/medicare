import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeviceStatus, useRegisterDevice } from "@/hooks/useQueries";
import { formatDateTime, formatRelativeTime } from "@/lib/api";
import { DeviceStatus } from "@/lib/types";
import type { Device } from "@/lib/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  Bluetooth,
  CheckCircle2,
  Clock,
  Info,
  Link2,
  Radio,
  RefreshCw,
  ShieldCheck,
  Watch,
  Wifi,
  XCircle,
} from "lucide-react";
import { useState } from "react";

function DeviceSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function DeviceDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-foreground">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function DevicePage() {
  const { identity } = useInternetIdentity();
  const patientId = identity?.getPrincipal() ?? Principal.anonymous();
  const {
    data: device,
    isLoading,
    isError,
    refetch,
  } = useDeviceStatus(patientId);
  const registerDevice = useRegisterDevice();

  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceToken, setDeviceToken] = useState("");

  const canSubmit =
    deviceName.trim().length > 0 &&
    deviceType.trim().length > 0 &&
    deviceToken.trim().length > 0;

  const handleRegister = () => {
    const token = new TextEncoder().encode(deviceToken.trim());
    const capturedName = deviceName.trim();
    const capturedType = deviceType.trim();
    const capturedToken = deviceToken.trim();
    setDeviceName("");
    setDeviceType("");
    setDeviceToken("");
    registerDevice.mutate(
      {
        deviceName: capturedName,
        deviceType: capturedType,
        deviceToken: token,
      },
      {
        onError: () => {
          setDeviceName((cur) => (cur === "" ? capturedName : cur));
          setDeviceType((cur) => (cur === "" ? capturedType : cur));
          setDeviceToken((cur) => (cur === "" ? capturedToken : cur));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Device"
          description="Connect and manage your health monitoring device."
        />
        <DeviceSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Device"
          description="Connect and manage your health monitoring device."
        />
        <EmptyState
          icon={<Watch className="h-6 w-6" />}
          title="Couldn't load your device"
          description="Something went wrong while checking your device status. Please try again."
          action={
            <Button
              type="button"
              data-ocid="device.retry_button"
              onClick={() => void refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  // No device registered yet
  if (!device) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Device"
          description="Connect your health monitoring device to start tracking your vitals."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Watch className="h-5 w-5 text-primary" />
                No device connected
              </CardTitle>
              <CardDescription>
                Register your device to begin secure vitals ingestion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={<Link2 className="h-6 w-6" />}
                title="Connect a device"
                description="Register a wearable or monitoring device to start sending your vitals."
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                Register your device
              </CardTitle>
              <CardDescription>
                Enter your device details and its secure ingestion token.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="grid gap-4 sm:grid-cols-2"
                data-ocid="device.form"
              >
                <div className="grid gap-2">
                  <Label htmlFor="deviceName">Device name</Label>
                  <Input
                    id="deviceName"
                    data-ocid="device.input.name"
                    placeholder="e.g. My Fitness Band"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deviceType">Device type</Label>
                  <Input
                    id="deviceType"
                    data-ocid="device.input.type"
                    placeholder="e.g. Wearable band"
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="deviceToken">Device token</Label>
                  <Input
                    id="deviceToken"
                    data-ocid="device.input.token"
                    placeholder="Paste the secure token issued with your device"
                    value={deviceToken}
                    onChange={(e) => setDeviceToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This token authenticates your device when it sends vitals to
                    the backend. Keep it private.
                  </p>
                </div>

                {registerDevice.isError ? (
                  <p
                    className="text-sm text-destructive sm:col-span-2"
                    data-ocid="device.error_state"
                  >
                    Couldn't register your device. Please check the details and
                    try again.
                  </p>
                ) : null}

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    data-ocid="device.submit_button"
                    disabled={!canSubmit || registerDevice.isPending}
                  >
                    <Link2 className="h-4 w-4" />
                    {registerDevice.isPending
                      ? "Registering…"
                      : "Register device"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <IngestionInfo />
      </div>
    );
  }

  const isActive = device.status === DeviceStatus.active;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device"
        description="View your connected device and its status."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  isActive
                    ? "bg-gradient-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Watch className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold">
                  {device.deviceName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {device.deviceType}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge
                label={isActive ? "Active" : "Inactive"}
                tone={isActive ? "success" : "neutral"}
              />
              {isActive ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                  Live
                </span>
              ) : null}
            </div>
            <DeviceDetail
              icon={<Clock className="h-4 w-4" />}
              label="Last seen"
              value={
                device.lastSeenAt
                  ? formatRelativeTime(device.lastSeenAt)
                  : "Never"
              }
            />
            <DeviceDetail
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Connected since"
              value={formatDateTime(device.createdAt)}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Device status
            </CardTitle>
            <CardDescription>
              {isActive
                ? "Your device is active and sending vitals."
                : "Your device is inactive. Check its connection and power."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`flex items-start gap-4 rounded-xl border p-5 ${
                isActive
                  ? "border-success/30 bg-success/5"
                  : "border-warning/30 bg-warning/5"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  isActive
                    ? "bg-success/15 text-success"
                    : "bg-warning/15 text-warning"
                }`}
              >
                {isActive ? (
                  <Wifi className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {isActive ? "Device is online" : "Device is offline"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isActive
                    ? "Vitals are being recorded and synced to your dashboard."
                    : "No recent readings received. Make sure the device is powered on and within range of its gateway."}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">
                  Secure ingestion
                </p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Your device sends readings to the MediCare+ backend using its
                secure token. Readings are stored on the Internet Computer and
                only you and your care team can view them.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <IngestionInfo />
    </div>
  );
}

function IngestionInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          How your device sends data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          MediCare+ receives vitals through a secure ingestion endpoint on the
          backend, authenticated by your device token. Your wearable or gateway
          posts readings to this endpoint, and they appear in your dashboard
          shortly after.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Wi-Fi / gateway devices
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Devices with internet connectivity can post readings directly to
                the ingestion endpoint.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bluetooth className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Bluetooth devices
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bluetooth Classic (e.g. HC-05) is not directly supported by web
                browsers. Pair it with a companion app or gateway that relays
                readings to MediCare+.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
