import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForConsultation,
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
import { useConsultations, useCreateConsultation } from "@/hooks/useQueries";
import { formatDate } from "@/lib/api";
import { Principal } from "@icp-sdk/core/principal";
import { AlertCircle, ClipboardList, Plus, Stethoscope } from "lucide-react";
import { useState } from "react";
import { DoctorPatientSelector } from "./DoctorPatientSelector";
import { dateInputToTimestamp, useDoctorPatients } from "./useDoctorPatients";

// Placeholder principal so the query hook's non-null parameter type is
// satisfied; the query is disabled while no patient is selected.
const FALLBACK_PRINCIPAL = Principal.fromText("2vxsx-fae");

export function DoctorConsultationsPage() {
  const {
    patients,
    selectedKey,
    setSelectedKey,
    selectedPatient,
    isLoading,
    error,
  } = useDoctorPatients();

  const consultations = useConsultations(
    selectedPatient?.patientId ?? FALLBACK_PRINCIPAL,
  );
  const createConsultation = useCreateConsultation();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const records = consultations.data ?? [];
  const listLoading = consultations.isLoading;

  function handleSubmit() {
    if (!selectedPatient) return;
    if (!reason.trim()) {
      setFormError("Reason is required.");
      return;
    }
    const captured = {
      patientId: selectedPatient.patientId,
      date: dateInputToTimestamp(date || new Date().toISOString().slice(0, 10)),
      reason: reason.trim(),
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
    };
    setReason("");
    setDiagnosis("");
    setNotes("");
    setDate("");
    setFormError(null);
    createConsultation.mutate(captured, {
      onSuccess: () => setOpen(false),
      onError: (err) => {
        setFormError(err.message || "Could not save the consultation.");
        setReason((current) => (current === "" ? captured.reason : current));
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="Create and review consultations for your assigned patients."
        actions={
          <Button
            type="button"
            data-ocid="new_consultation_button"
            onClick={() => setOpen(true)}
            disabled={!selectedPatient}
          >
            <Plus className="h-4 w-4" /> New consultation
          </Button>
        }
      />

      <DoctorPatientSelector
        patients={patients}
        value={selectedKey}
        onChange={setSelectedKey}
      />

      {isLoading ? (
        <ConsultationsSkeleton />
      ) : error ? (
        <ErrorState message="We couldn't load your patients. Please try again." />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-6 w-6" />}
          title="No assigned patients"
          description="You don't have any patients assigned to your care yet. Consultations you create will appear in the correct patient's account once they are assigned."
        />
      ) : listLoading ? (
        <ConsultationsSkeleton />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="No consultations yet"
          description="Create the first consultation for this patient to start their care record."
          action={
            <Button
              type="button"
              data-ocid="empty_new_consultation_button"
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4" /> New consultation
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {records.map((c) => (
            <Card key={c.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="font-display text-base">
                    {c.reason || "Consultation"}
                  </CardTitle>
                  <StatusBadge
                    label={c.status}
                    tone={statusToneForConsultation(c.status)}
                  />
                </div>
                <CardDescription>{formatDate(c.date)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {c.diagnosis ? (
                  <div>
                    <p className="font-medium text-foreground">Diagnosis</p>
                    <p className="text-muted-foreground">{c.diagnosis}</p>
                  </div>
                ) : null}
                {c.notes ? (
                  <div>
                    <p className="font-medium text-foreground">Notes</p>
                    <p className="text-muted-foreground">{c.notes}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New consultation</DialogTitle>
            <DialogDescription>
              Record a consultation for the selected patient. It will appear in
              their account immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consultation-date">Date</Label>
              <Input
                id="consultation-date"
                type="date"
                data-ocid="consultation_date_input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation-reason">Reason *</Label>
              <Input
                id="consultation-reason"
                data-ocid="consultation_reason_input"
                placeholder="e.g. Follow-up on hypertension"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation-diagnosis">Diagnosis</Label>
              <Input
                id="consultation-diagnosis"
                data-ocid="consultation_diagnosis_input"
                placeholder="e.g. Stage 1 hypertension"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consultation-notes">Notes</Label>
              <Textarea
                id="consultation-notes"
                data-ocid="consultation_notes_input"
                placeholder="Clinical notes, observations, next steps…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {formError ? (
              <p
                data-ocid="consultation_form_error"
                className="flex items-center gap-2 text-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4" /> {formError}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-ocid="submit_button"
              onClick={handleSubmit}
              disabled={createConsultation.isPending || !reason.trim()}
            >
              {createConsultation.isPending ? "Saving…" : "Save consultation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsultationsSkeleton() {
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
            <Skeleton className="h-4 w-4/5" />
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
