import { VitalSource } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddManualVital, useLatestVitals } from "@/hooks/useQueries";
import { formatRelativeTime } from "@/lib/api";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  Droplets,
  HeartPulse,
  Scale,
  Thermometer,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ReadingRow {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  manual: boolean;
}

function LatestReading({ label, value, unit, icon, manual }: ReadingRow) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {manual ? "Manual entry" : "Device reading"}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display text-lg font-semibold text-foreground">
          {value}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        </p>
      </div>
    </div>
  );
}

interface FormState {
  heartRate: string;
  spo2: string;
  temperature: string;
  systolicBP: string;
  diastolicBP: string;
  bloodSugar: string;
  weight: string;
  bmi: string;
}

const emptyForm: FormState = {
  heartRate: "",
  spo2: "",
  temperature: "",
  systolicBP: "",
  diastolicBP: "",
  bloodSugar: "",
  weight: "",
  bmi: "",
};

function parseNum(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function MyVitalsPage() {
  const { identity } = useInternetIdentity();
  const patientId = identity?.getPrincipal() ?? Principal.anonymous();

  const latestQuery = useLatestVitals(patientId);
  const addVital = useAddManualVital();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const latest = latestQuery.data;

  const setField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const readings: ReadingRow[] = [
    {
      label: "Heart Rate",
      value: latest?.heartRate !== undefined ? String(latest.heartRate) : "—",
      unit: "bpm",
      icon: <HeartPulse className="h-4 w-4" />,
      manual: latest?.source === VitalSource.manual,
    },
    {
      label: "SpO₂",
      value: latest?.spo2 !== undefined ? String(latest.spo2) : "—",
      unit: "%",
      icon: <Droplets className="h-4 w-4" />,
      manual: latest?.source === VitalSource.manual,
    },
    {
      label: "Temperature",
      value:
        latest?.temperature !== undefined ? String(latest.temperature) : "—",
      unit: "°C",
      icon: <Thermometer className="h-4 w-4" />,
      manual: latest?.source === VitalSource.manual,
    },
    {
      label: "Blood Pressure",
      value:
        latest?.systolicBP !== undefined && latest?.diastolicBP !== undefined
          ? `${latest.systolicBP}/${latest.diastolicBP}`
          : "—",
      unit: "mmHg",
      icon: <Activity className="h-4 w-4" />,
      manual: true,
    },
    {
      label: "Blood Sugar",
      value: latest?.bloodSugar !== undefined ? String(latest.bloodSugar) : "—",
      unit: "mg/dL",
      icon: <Droplets className="h-4 w-4" />,
      manual: true,
    },
    {
      label: "Weight",
      value: latest?.weight !== undefined ? String(latest.weight) : "—",
      unit: "kg",
      icon: <Scale className="h-4 w-4" />,
      manual: latest?.source === VitalSource.manual,
    },
    {
      label: "BMI",
      value: latest?.bmi !== undefined ? String(latest.bmi) : "—",
      unit: "kg/m²",
      icon: <Scale className="h-4 w-4" />,
      manual: latest?.source === VitalSource.manual,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    const heartRate = parseNum(form.heartRate);
    const spo2 = parseNum(form.spo2);
    const temperature = parseNum(form.temperature);
    const systolicBP = parseNum(form.systolicBP);
    const diastolicBP = parseNum(form.diastolicBP);
    const bloodSugar = parseNum(form.bloodSugar);
    const weight = parseNum(form.weight);
    const bmi = parseNum(form.bmi);

    if (form.heartRate !== "" && heartRate === null)
      nextErrors.heartRate = "Enter a valid number";
    if (form.spo2 !== "" && spo2 === null)
      nextErrors.spo2 = "Enter a valid number";
    if (form.temperature !== "" && temperature === null)
      nextErrors.temperature = "Enter a valid number";
    if (form.systolicBP !== "" && systolicBP === null)
      nextErrors.systolicBP = "Enter a valid number";
    if (form.diastolicBP !== "" && diastolicBP === null)
      nextErrors.diastolicBP = "Enter a valid number";
    if (form.bloodSugar !== "" && bloodSugar === null)
      nextErrors.bloodSugar = "Enter a valid number";
    if (form.weight !== "" && weight === null)
      nextErrors.weight = "Enter a valid number";
    if (form.bmi !== "" && bmi === null)
      nextErrors.bmi = "Enter a valid number";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (
      heartRate === null &&
      spo2 === null &&
      temperature === null &&
      systolicBP === null &&
      diastolicBP === null &&
      bloodSugar === null &&
      weight === null &&
      bmi === null
    ) {
      setErrors({ heartRate: "Enter at least one reading" });
      return;
    }

    const captured = form;
    setForm(emptyForm);
    setErrors({});

    addVital.mutate(
      {
        heartRate: heartRate !== null ? BigInt(Math.round(heartRate)) : null,
        spo2: spo2 !== null ? BigInt(Math.round(spo2)) : null,
        temperature,
        systolicBP: systolicBP !== null ? BigInt(Math.round(systolicBP)) : null,
        diastolicBP:
          diastolicBP !== null ? BigInt(Math.round(diastolicBP)) : null,
        bloodSugar,
        weight,
        bmi,
        recordedAt: BigInt(Date.now()) * 1_000_000n,
      },
      {
        onError: () => {
          setForm(captured);
          toast.error("Could not save your reading. Please try again.");
        },
        onSuccess: () => {
          toast.success("Reading saved");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vitals"
        description="Review your latest measurements and record a new reading."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Latest readings */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Latest readings</CardTitle>
              {latest ? (
                <StatusBadge
                  label={
                    latest.source === VitalSource.manual ? "Manual" : "Device"
                  }
                  tone={
                    latest.source === VitalSource.manual ? "info" : "success"
                  }
                />
              ) : null}
            </CardHeader>
            <CardContent>
              {latestQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !latest ? (
                <EmptyState
                  icon={<HeartPulse className="h-6 w-6" />}
                  title="No readings yet"
                  description="Record your first reading using the form, or connect a device to stream readings automatically."
                />
              ) : (
                <div className="space-y-3">
                  {readings.map((r) => (
                    <LatestReading key={r.label} {...r} />
                  ))}
                  <p className="pt-1 text-xs text-muted-foreground">
                    Last updated{" "}
                    {latest.recordedAt !== undefined
                      ? formatRelativeTime(latest.recordedAt)
                      : "—"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Manual entry form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a manual reading</CardTitle>
              <p className="text-sm text-muted-foreground">
                Blood pressure and blood sugar are always entered manually.
                Leave fields blank to skip them.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="heartRate">Heart rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      data-ocid="vital.heart_rate"
                      inputMode="decimal"
                      placeholder="72"
                      value={form.heartRate}
                      onChange={(e) => setField("heartRate", e.target.value)}
                      aria-invalid={!!errors.heartRate}
                    />
                    {errors.heartRate ? (
                      <p className="text-xs text-red-600">{errors.heartRate}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="spo2">SpO₂ (%)</Label>
                    <Input
                      id="spo2"
                      data-ocid="vital.spo2"
                      inputMode="decimal"
                      placeholder="98"
                      value={form.spo2}
                      onChange={(e) => setField("spo2", e.target.value)}
                      aria-invalid={!!errors.spo2}
                    />
                    {errors.spo2 ? (
                      <p className="text-xs text-red-600">{errors.spo2}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      data-ocid="vital.temperature"
                      inputMode="decimal"
                      placeholder="36.6"
                      value={form.temperature}
                      onChange={(e) => setField("temperature", e.target.value)}
                      aria-invalid={!!errors.temperature}
                    />
                    {errors.temperature ? (
                      <p className="text-xs text-red-600">
                        {errors.temperature}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      data-ocid="vital.weight"
                      inputMode="decimal"
                      placeholder="70.5"
                      value={form.weight}
                      onChange={(e) => setField("weight", e.target.value)}
                      aria-invalid={!!errors.weight}
                    />
                    {errors.weight ? (
                      <p className="text-xs text-red-600">{errors.weight}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="systolicBP">Systolic BP (mmHg)</Label>
                    <Input
                      id="systolicBP"
                      data-ocid="vital.systolic"
                      inputMode="decimal"
                      placeholder="120"
                      value={form.systolicBP}
                      onChange={(e) => setField("systolicBP", e.target.value)}
                      aria-invalid={!!errors.systolicBP}
                    />
                    {errors.systolicBP ? (
                      <p className="text-xs text-red-600">
                        {errors.systolicBP}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="diastolicBP">Diastolic BP (mmHg)</Label>
                    <Input
                      id="diastolicBP"
                      data-ocid="vital.diastolic"
                      inputMode="decimal"
                      placeholder="80"
                      value={form.diastolicBP}
                      onChange={(e) => setField("diastolicBP", e.target.value)}
                      aria-invalid={!!errors.diastolicBP}
                    />
                    {errors.diastolicBP ? (
                      <p className="text-xs text-red-600">
                        {errors.diastolicBP}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bloodSugar">Blood sugar (mg/dL)</Label>
                    <Input
                      id="bloodSugar"
                      data-ocid="vital.blood_sugar"
                      inputMode="decimal"
                      placeholder="95"
                      value={form.bloodSugar}
                      onChange={(e) => setField("bloodSugar", e.target.value)}
                      aria-invalid={!!errors.bloodSugar}
                    />
                    {errors.bloodSugar ? (
                      <p className="text-xs text-red-600">
                        {errors.bloodSugar}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bmi">BMI (kg/m²)</Label>
                    <Input
                      id="bmi"
                      data-ocid="vital.bmi"
                      inputMode="decimal"
                      placeholder="24.5"
                      value={form.bmi}
                      onChange={(e) => setField("bmi", e.target.value)}
                      aria-invalid={!!errors.bmi}
                    />
                    {errors.bmi ? (
                      <p className="text-xs text-red-600">{errors.bmi}</p>
                    ) : null}
                  </div>
                </div>

                <Button
                  type="submit"
                  data-ocid="vital.save_button"
                  className="w-full"
                  disabled={addVital.isPending}
                >
                  {addVital.isPending ? "Saving…" : "Save reading"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
