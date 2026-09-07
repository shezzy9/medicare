import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForAppointment,
  statusToneForConsultation,
  statusToneForPrescription,
} from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAppointments,
  useConsultations,
  useLatestVitals,
  useMedicalHistory,
  usePrescriptions,
  useVitalsHistory,
} from "@/hooks/useQueries";
import { formatDate, formatDateTime, shortPrincipal } from "@/lib/api";
import {
  type Appointment,
  type Consultation,
  type MedicalHistory,
  type Prescription,
  TimeRange,
  type Vital,
} from "@/lib/types";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useParams } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: "24h", value: TimeRange.h24 },
  { label: "Week", value: TimeRange.d7 },
  { label: "Month", value: TimeRange.d30 },
];

function VitalStat({
  label,
  value,
  unit,
}: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">
        {value}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

function VitalsPanel({ patientId }: { patientId: Principal }) {
  const [range, setRange] = useState<TimeRange>(TimeRange.d7);
  const { data: latest, isLoading: latestLoading } = useLatestVitals(patientId);
  const { data: history = [], isLoading: historyLoading } = useVitalsHistory(
    patientId,
    range,
  );

  const chartData = useMemo(
    () =>
      history
        .filter((v) => v.heartRate != null)
        .map((v) => ({
          time: formatDateTime(v.recordedAt),
          heartRate: Number(v.heartRate),
        })),
    [history],
  );

  if (latestLoading || historyLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((id) => (
            <Skeleton key={id} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <VitalStat
          label="Heart Rate"
          value={latest?.heartRate != null ? String(latest.heartRate) : "—"}
          unit="bpm"
        />
        <VitalStat
          label="Blood Pressure"
          value={
            latest?.systolicBP != null && latest?.diastolicBP != null
              ? `${latest.systolicBP}/${latest.diastolicBP}`
              : "—"
          }
          unit="mmHg"
        />
        <VitalStat
          label="SpO₂"
          value={latest?.spo2 != null ? String(latest.spo2) : "—"}
          unit="%"
        />
        <VitalStat
          label="Blood Sugar"
          value={latest?.bloodSugar != null ? String(latest.bloodSugar) : "—"}
          unit="mg/dL"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Heart Rate Trend
          </CardTitle>
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                data-ocid={`vitals_range.${opt.value}`}
                onClick={() => setRange(opt.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-smooth ${
                  range === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No heart rate readings"
              description="Heart rate history for this patient will appear here."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickFormatter={(v: string) => v.split(",")[0]}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    domain={["auto", "auto"]}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MedicalHistoryPanel({ patientId }: { patientId: Principal }) {
  const { data: items = [], isLoading } = useMedicalHistory(patientId);
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
          <Skeleton key={id} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title="No medical history"
        description="Conditions and treatments recorded for this patient will appear here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item: MedicalHistory) => (
        <Card key={item.id.toString()}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.condition}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(item.date)}
                </p>
              </div>
              <StatusBadge label="Recorded" tone="info" />
            </div>
            <p className="mt-3 text-sm text-foreground">
              <span className="font-medium">Diagnosis:</span> {item.diagnosis}
            </p>
            <p className="mt-1 text-sm text-foreground">
              <span className="font-medium">Treatment:</span> {item.treatment}
            </p>
            {item.notes ? (
              <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ConsultationsPanel({ patientId }: { patientId: Principal }) {
  const { data: items = [], isLoading } = useConsultations(patientId);
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
          <Skeleton key={id} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Stethoscope className="h-6 w-6" />}
        title="No consultations"
        description="Consultations for this patient will appear here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item: Consultation) => (
        <Card key={item.id.toString()}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.reason}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDateTime(item.date)}
                </p>
              </div>
              <StatusBadge
                label={item.status}
                tone={statusToneForConsultation(item.status)}
              />
            </div>
            <p className="mt-3 text-sm text-foreground">
              <span className="font-medium">Diagnosis:</span> {item.diagnosis}
            </p>
            {item.notes ? (
              <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PrescriptionsPanel({ patientId }: { patientId: Principal }) {
  const { data: items = [], isLoading } = usePrescriptions(patientId);
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
          <Skeleton key={id} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Pill className="h-6 w-6" />}
        title="No prescriptions"
        description="Prescriptions issued to this patient will appear here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item: Prescription) => (
        <Card key={item.id.toString()}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {item.medicines.map((m) => m.name).join(", ")}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(item.date)}
                </p>
              </div>
              <StatusBadge
                label={item.status}
                tone={statusToneForPrescription(item.status)}
              />
            </div>
            <ul className="mt-3 space-y-1">
              {item.medicines.map((m) => (
                <li key={m.id.toString()} className="text-sm text-foreground">
                  <span className="font-medium">{m.name}</span> — {m.dosage},{" "}
                  {m.frequency}, {m.duration}
                </li>
              ))}
            </ul>
            {item.instructions ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {item.instructions}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AppointmentsPanel({ patientId }: { patientId: Principal }) {
  const { data: items = [], isLoading } = useAppointments(patientId);
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => `sk-${i}`).map((id) => (
          <Skeleton key={id} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays className="h-6 w-6" />}
        title="No appointments"
        description="Appointments for this patient will appear here."
      />
    );
  }
  return (
    <div className="space-y-3">
      {items.map((item: Appointment) => (
        <Card key={item.id.toString()}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.reason}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {formatDate(item.date)} · {item.time}
                </p>
              </div>
              <StatusBadge
                label={item.status}
                tone={statusToneForAppointment(item.status)}
              />
            </div>
            {item.notes ? (
              <p className="mt-3 text-sm text-muted-foreground">{item.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PatientDetailsPage() {
  const { patientId } = useParams({ strict: false });

  const patientPrincipal = useMemo(() => {
    if (!patientId) return null;
    try {
      return Principal.fromText(patientId);
    } catch {
      return null;
    }
  }, [patientId]);

  if (!patientPrincipal) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Patient Details"
          description="Patient health record."
        />
        <EmptyState
          icon={<HeartPulse className="h-6 w-6" />}
          title="Invalid patient"
          description="This patient record could not be found."
          action={
            <Button asChild data-ocid="back_to_patients_button">
              <Link to="/doctor/patients">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to patients
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const pid = patientPrincipal.toString();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Details"
        description={`Health record for patient ${shortPrincipal(pid)}.`}
        actions={
          <Button asChild variant="outline" data-ocid="back_to_patients_button">
            <Link to="/doctor/patients">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to patients
            </Link>
          </Button>
        }
      />

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary/10 text-primary">
            {pid.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-tight text-foreground">
            {shortPrincipal(pid)}
          </p>
          <p className="text-sm text-muted-foreground">Patient ID: {pid}</p>
        </div>
      </div>

      <Tabs defaultValue="vitals" data-ocid="patient_tabs">
        <TabsList className="flex w-full flex-wrap justify-start gap-1 overflow-x-auto">
          <TabsTrigger value="vitals" data-ocid="tab.vitals">
            <Activity className="mr-1.5 h-4 w-4" /> Vitals
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="tab.history">
            <FileText className="mr-1.5 h-4 w-4" /> Medical History
          </TabsTrigger>
          <TabsTrigger value="consultations" data-ocid="tab.consultations">
            <Stethoscope className="mr-1.5 h-4 w-4" /> Consultations
          </TabsTrigger>
          <TabsTrigger value="prescriptions" data-ocid="tab.prescriptions">
            <Pill className="mr-1.5 h-4 w-4" /> Prescriptions
          </TabsTrigger>
          <TabsTrigger value="appointments" data-ocid="tab.appointments">
            <CalendarDays className="mr-1.5 h-4 w-4" /> Appointments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vitals" className="mt-4">
          <VitalsPanel patientId={patientPrincipal} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <MedicalHistoryPanel patientId={patientPrincipal} />
        </TabsContent>
        <TabsContent value="consultations" className="mt-4">
          <ConsultationsPanel patientId={patientPrincipal} />
        </TabsContent>
        <TabsContent value="prescriptions" className="mt-4">
          <PrescriptionsPanel patientId={patientPrincipal} />
        </TabsContent>
        <TabsContent value="appointments" className="mt-4">
          <AppointmentsPanel patientId={patientPrincipal} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
