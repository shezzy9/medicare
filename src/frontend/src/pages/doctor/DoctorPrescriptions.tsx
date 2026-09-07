import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForPrescription,
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
import { useCreatePrescription, usePrescriptions } from "@/hooks/useQueries";
import { formatDate } from "@/lib/api";
import type { Medicine } from "@/lib/types";
import { Principal } from "@icp-sdk/core/principal";
import { AlertCircle, Pill, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { DoctorPatientSelector } from "./DoctorPatientSelector";
import { dateInputToTimestamp, useDoctorPatients } from "./useDoctorPatients";

// Placeholder principal so the query hook's non-null parameter type is
// satisfied; the query is disabled while no patient is selected.
const FALLBACK_PRINCIPAL = Principal.fromText("2vxsx-fae");

interface MedicineDraft {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

let medicineSeq = 0;

function emptyMedicine(): MedicineDraft {
  medicineSeq += 1;
  return {
    id: medicineSeq,
    name: "",
    dosage: "",
    frequency: "",
    duration: "",
  };
}

export function DoctorPrescriptionsPage() {
  const {
    patients,
    selectedKey,
    setSelectedKey,
    selectedPatient,
    isLoading,
    error,
  } = useDoctorPatients();

  const prescriptions = usePrescriptions(
    selectedPatient?.patientId ?? FALLBACK_PRINCIPAL,
  );
  const createPrescription = useCreatePrescription();

  const [open, setOpen] = useState(false);
  const [medicines, setMedicines] = useState<MedicineDraft[]>([
    emptyMedicine(),
  ]);
  const [instructions, setInstructions] = useState("");
  const [date, setDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const records = prescriptions.data ?? [];
  const listLoading = prescriptions.isLoading;

  function updateMedicine(id: number, patch: Partial<MedicineDraft>) {
    setMedicines((current) =>
      current.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  }

  function handleSubmit() {
    if (!selectedPatient) return;
    const validMedicines = medicines.filter((m) => m.name.trim() !== "");
    if (validMedicines.length === 0) {
      setFormError("Add at least one medicine with a name.");
      return;
    }
    const payload: Medicine[] = validMedicines.map((m, i) => ({
      id: BigInt(i),
      name: m.name.trim(),
      dosage: m.dosage.trim(),
      frequency: m.frequency.trim(),
      duration: m.duration.trim(),
    }));
    const captured = {
      patientId: selectedPatient.patientId,
      medicines: payload,
      instructions: instructions.trim(),
      date: dateInputToTimestamp(date || new Date().toISOString().slice(0, 10)),
    };
    setMedicines([emptyMedicine()]);
    setInstructions("");
    setDate("");
    setFormError(null);
    createPrescription.mutate(captured, {
      onSuccess: () => setOpen(false),
      onError: (err) => {
        setFormError(err.message || "Could not save the prescription.");
        setMedicines((current) =>
          current.length === 1 && current[0].name === ""
            ? payload.map((m) => ({
                id: emptyMedicine().id,
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                duration: m.duration,
              }))
            : current,
        );
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        description="Create and review prescriptions for your assigned patients."
        actions={
          <Button
            type="button"
            data-ocid="new_prescription_button"
            onClick={() => setOpen(true)}
            disabled={!selectedPatient}
          >
            <Plus className="h-4 w-4" /> New prescription
          </Button>
        }
      />

      <DoctorPatientSelector
        patients={patients}
        value={selectedKey}
        onChange={setSelectedKey}
      />

      {isLoading ? (
        <PrescriptionsSkeleton />
      ) : error ? (
        <ErrorState message="We couldn't load your patients. Please try again." />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<Pill className="h-6 w-6" />}
          title="No assigned patients"
          description="You don't have any patients assigned to your care yet. Prescriptions you create will appear in the correct patient's account once they are assigned."
        />
      ) : listLoading ? (
        <PrescriptionsSkeleton />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Pill className="h-6 w-6" />}
          title="No prescriptions yet"
          description="Create the first prescription for this patient to begin their treatment plan."
          action={
            <Button
              type="button"
              data-ocid="empty_new_prescription_button"
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4" /> New prescription
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {records.map((p) => (
            <Card key={p.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="font-display text-base">
                    Prescription
                  </CardTitle>
                  <StatusBadge
                    label={p.status}
                    tone={statusToneForPrescription(p.status)}
                  />
                </div>
                <CardDescription>{formatDate(p.date)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ul className="space-y-2">
                  {p.medicines.map((m) => (
                    <li
                      key={m.id.toString()}
                      className="flex items-start justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[m.dosage, m.frequency, m.duration]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                {p.instructions ? (
                  <p className="text-muted-foreground">{p.instructions}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New prescription</DialogTitle>
            <DialogDescription>
              Add the medicines for this patient. The prescription will appear
              in their account immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prescription-date">Date</Label>
              <Input
                id="prescription-date"
                type="date"
                data-ocid="prescription_date_input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Medicines *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="add_medicine_button"
                  onClick={() =>
                    setMedicines((current) => [...current, emptyMedicine()])
                  }
                >
                  <Plus className="h-4 w-4" /> Add medicine
                </Button>
              </div>

              {medicines.map((m, index) => (
                <div
                  key={m.id}
                  className="space-y-2 rounded-lg border border-border bg-muted/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Medicine {index + 1}
                    </p>
                    {medicines.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-ocid={`remove_medicine_button.${index + 1}`}
                        aria-label={`Remove medicine ${index + 1}`}
                        onClick={() =>
                          setMedicines((current) =>
                            current.filter((item) => item.id !== m.id),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`medicine-name-${m.id}`}
                        className="text-xs"
                      >
                        Name
                      </Label>
                      <Input
                        id={`medicine-name-${m.id}`}
                        data-ocid={`medicine_name_input.${index + 1}`}
                        placeholder="e.g. Amlodipine"
                        value={m.name}
                        onChange={(e) =>
                          updateMedicine(m.id, { name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`medicine-dosage-${m.id}`}
                        className="text-xs"
                      >
                        Dosage
                      </Label>
                      <Input
                        id={`medicine-dosage-${m.id}`}
                        data-ocid={`medicine_dosage_input.${index + 1}`}
                        placeholder="e.g. 5 mg"
                        value={m.dosage}
                        onChange={(e) =>
                          updateMedicine(m.id, { dosage: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`medicine-frequency-${m.id}`}
                        className="text-xs"
                      >
                        Frequency
                      </Label>
                      <Input
                        id={`medicine-frequency-${m.id}`}
                        data-ocid={`medicine_frequency_input.${index + 1}`}
                        placeholder="e.g. Once daily"
                        value={m.frequency}
                        onChange={(e) =>
                          updateMedicine(m.id, { frequency: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`medicine-duration-${m.id}`}
                        className="text-xs"
                      >
                        Duration
                      </Label>
                      <Input
                        id={`medicine-duration-${m.id}`}
                        data-ocid={`medicine_duration_input.${index + 1}`}
                        placeholder="e.g. 30 days"
                        value={m.duration}
                        onChange={(e) =>
                          updateMedicine(m.id, { duration: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prescription-instructions">Instructions</Label>
              <Textarea
                id="prescription-instructions"
                data-ocid="prescription_instructions_input"
                placeholder="e.g. Take with food. Avoid grapefruit juice."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            {formError ? (
              <p
                data-ocid="prescription_form_error"
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
              disabled={
                createPrescription.isPending ||
                !medicines.some((m) => m.name.trim() !== "")
              }
            >
              {createPrescription.isPending ? "Saving…" : "Save prescription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PrescriptionsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
        <Card key={id}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-10 w-full" />
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
