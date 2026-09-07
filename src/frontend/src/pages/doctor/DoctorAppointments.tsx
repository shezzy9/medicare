import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForAppointment,
} from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppointments, useManageAppointment } from "@/hooks/useQueries";
import { formatDate } from "@/lib/api";
import { AppointmentStatus } from "@/lib/types";
import { Principal } from "@icp-sdk/core/principal";
import { AlertCircle, CalendarDays, Check, X } from "lucide-react";
import { useState } from "react";
import { DoctorPatientSelector } from "./DoctorPatientSelector";
import { useDoctorPatients } from "./useDoctorPatients";

// Placeholder principal so the query hook's non-null parameter type is
// satisfied; the query is disabled while no patient is selected.
const FALLBACK_PRINCIPAL = Principal.fromText("2vxsx-fae");

export function DoctorAppointmentsPage() {
  const {
    patients,
    selectedKey,
    setSelectedKey,
    selectedPatient,
    isLoading,
    error,
  } = useDoctorPatients();

  const appointments = useAppointments(
    selectedPatient?.patientId ?? FALLBACK_PRINCIPAL,
  );
  const manageAppointment = useManageAppointment();

  const [actionError, setActionError] = useState<string | null>(null);

  const records = appointments.data ?? [];
  const listLoading = appointments.isLoading;

  function handleManage(id: bigint, status: AppointmentStatus) {
    setActionError(null);
    manageAppointment.mutate(
      { id, status },
      {
        onError: (err) =>
          setActionError(err.message || "Could not update the appointment."),
      },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Review and manage appointments for your assigned patients."
      />

      <DoctorPatientSelector
        patients={patients}
        value={selectedKey}
        onChange={setSelectedKey}
      />

      {actionError ? (
        <p
          data-ocid="appointment_action_error"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4" /> {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <AppointmentsSkeleton />
      ) : error ? (
        <ErrorState message="We couldn't load your patients. Please try again." />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No assigned patients"
          description="You don't have any patients assigned to your care yet. Appointments for your patients will appear here once they are assigned."
        />
      ) : listLoading ? (
        <AppointmentsSkeleton />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No appointments"
          description="This patient has no appointments yet. New bookings will appear here automatically."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {records.map((a) => (
            <Card key={a.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="font-display text-base">
                    {a.reason || "Appointment"}
                  </CardTitle>
                  <StatusBadge
                    label={a.status}
                    tone={statusToneForAppointment(a.status)}
                  />
                </div>
                <CardDescription>
                  {formatDate(a.date)}
                  {a.time ? ` at ${a.time}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {a.notes ? (
                  <p className="text-muted-foreground">{a.notes}</p>
                ) : null}
                {a.status === AppointmentStatus.scheduled ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      data-ocid={`complete_appointment_button.${a.id.toString()}`}
                      onClick={() =>
                        handleManage(a.id, AppointmentStatus.completed)
                      }
                      disabled={manageAppointment.isPending}
                    >
                      <Check className="h-4 w-4" /> Mark completed
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      data-ocid={`cancel_appointment_button.${a.id.toString()}`}
                      onClick={() =>
                        handleManage(a.id, AppointmentStatus.cancelled)
                      }
                      disabled={manageAppointment.isPending}
                    >
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
        <Card key={id}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      data-ocid="error_state"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
