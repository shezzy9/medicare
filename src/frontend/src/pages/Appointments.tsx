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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAppointments,
  useBookAppointment,
  useCancelAppointment,
} from "@/hooks/useQueries";
import { formatDate, formatDateTime } from "@/lib/api";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Loader2,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

interface BookingForm {
  doctorId: string;
  date: string;
  time: string;
  reason: string;
  notes: string;
}

const emptyForm: BookingForm = {
  doctorId: "",
  date: "",
  time: "",
  reason: "",
  notes: "",
};

export function AppointmentsPage() {
  const { identity } = useInternetIdentity();
  const patientId = useMemo(() => identity?.getPrincipal() ?? null, [identity]);

  const appointmentsQuery = useAppointments(patientId as Principal);
  const bookAppointment = useBookAppointment();
  const cancelAppointment = useCancelAppointment();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BookingForm>(emptyForm);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<bigint | null>(null);

  const appointments = appointmentsQuery.data ?? [];

  const setField = (field: keyof BookingForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const canSubmit =
    form.doctorId.trim() !== "" &&
    form.date !== "" &&
    form.time !== "" &&
    form.reason.trim() !== "" &&
    !bookAppointment.isPending;

  const handleSubmit = () => {
    let doctor: Principal;
    try {
      doctor = Principal.fromText(form.doctorId.trim());
    } catch {
      setDoctorError("Enter a valid doctor ID (principal).");
      return;
    }
    setDoctorError(null);

    const dateTime = new Date(`${form.date}T${form.time || "12:00"}`);
    const timestamp = BigInt(dateTime.getTime()) * 1_000_000n;

    const captured = { ...form };
    setForm(emptyForm);
    setOpen(false);
    bookAppointment.mutate(
      {
        doctorId: doctor,
        date: timestamp,
        time: captured.time,
        reason: captured.reason.trim(),
        notes: captured.notes.trim(),
      },
      {
        onError: () => {
          setForm(captured);
          setOpen(true);
        },
      },
    );
  };

  const handleCancel = (id: bigint) => {
    setCancelId(id);
    cancelAppointment.mutate(id, {
      onSettled: () => setCancelId(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Book, view, and manage your appointments with healthcare providers."
        actions={
          <Button
            type="button"
            data-ocid="book_appointment_button"
            onClick={() => setOpen(true)}
          >
            <CalendarPlus className="h-4 w-4" />
            Book appointment
          </Button>
        }
      />

      {appointmentsQuery.isLoading ? (
        <div className="space-y-3" data-ocid="loading_state">
          {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : appointmentsQuery.isError ? (
        <Card data-ocid="error_state">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                Couldn&apos;t load your appointments
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Something went wrong while fetching your appointments. Please
                try again.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              data-ocid="retry_button"
              onClick={() => void appointmentsQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No appointments yet"
          description="Book your first appointment with a healthcare provider to get started."
          action={
            <Button
              type="button"
              data-ocid="book_appointment_button"
              onClick={() => setOpen(true)}
            >
              <CalendarPlus className="h-4 w-4" />
              Book appointment
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {appointments.map((appointment) => {
            const isCancelling = cancelId === appointment.id;
            return (
              <Card
                key={appointment.id.toString()}
                data-ocid={`appointment.item.${appointment.id.toString()}`}
                className="transition-smooth hover:shadow-subtle"
              >
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Stethoscope className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate">{appointment.reason}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(appointment.date)}
                    </CardDescription>
                  </div>
                  <StatusBadge
                    label={appointment.status}
                    tone={statusToneForAppointment(appointment.status)}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {formatDate(appointment.date)} at {appointment.time}
                    </span>
                  </div>
                  {appointment.notes ? (
                    <p className="text-sm text-muted-foreground">
                      {appointment.notes}
                    </p>
                  ) : null}
                  {appointment.status === "scheduled" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      data-ocid={`cancel_button.${appointment.id.toString()}`}
                      disabled={isCancelling}
                      onClick={() => handleCancel(appointment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      {isCancelling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Cancel appointment
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-ocid="book_appointment_modal">
          <DialogHeader>
            <DialogTitle>Book an appointment</DialogTitle>
            <DialogDescription>
              Fill in the details below to schedule your appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctorId">Doctor ID</Label>
              <Input
                id="doctorId"
                data-ocid="doctor_id_input"
                placeholder="e.g. uqqxf-5h777-77774-qaaaa-cai"
                value={form.doctorId}
                onChange={(e) => setField("doctorId", e.target.value)}
                aria-invalid={!!doctorError}
              />
              {doctorError ? (
                <p
                  className="text-sm text-destructive"
                  data-ocid="doctor_id_error"
                >
                  {doctorError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter the principal ID of the doctor you&apos;d like to see.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  data-ocid="date_input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  data-ocid="time_input"
                  type="time"
                  value={form.time}
                  onChange={(e) => setField("time", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                data-ocid="reason_input"
                placeholder="e.g. Annual check-up"
                value={form.reason}
                onChange={(e) => setField("reason", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                data-ocid="notes_input"
                placeholder="Any additional details for your provider"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            {bookAppointment.isError ? (
              <p className="text-sm text-destructive" data-ocid="book_error">
                Couldn&apos;t book your appointment. Please try again.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="cancel_button"
              onClick={() => {
                setOpen(false);
                setDoctorError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-ocid="submit_button"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {bookAppointment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Book appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
