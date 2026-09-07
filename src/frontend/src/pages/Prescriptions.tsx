import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  StatusBadge,
  statusToneForPrescription,
} from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallerPatientProfile, usePrescriptions } from "@/hooks/useQueries";
import { formatDate, formatDateTime } from "@/lib/api";
import type { Prescription } from "@/lib/types";
import type { Principal } from "@icp-sdk/core/principal";
import { Pill, RefreshCw, Stethoscope } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function PrescriptionsList({ patientId }: { patientId: Principal }) {
  const { data, isLoading, isError, refetch } = usePrescriptions(patientId);
  const [selected, setSelected] = useState<Prescription | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="loading_state">
        {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
          <Skeleton key={id} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-ocid="error_state"
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-14 text-center"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <Stethoscope className="h-6 w-6" />
        </div>
        <h3 className="font-display text-base font-semibold text-foreground">
          Couldn't load your prescriptions
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Something went wrong while fetching your prescriptions. Please try
          again.
        </p>
        <button
          type="button"
          data-ocid="retry_button"
          onClick={() => void refetch()}
          className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Pill className="h-6 w-6" />}
        title="No prescriptions yet"
        description="Prescriptions written by your doctors will appear here with dosage and medicine details."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {data.map((prescription, index) => (
          <motion.button
            key={prescription.id.toString()}
            type="button"
            data-ocid={`prescription.item.${index + 1}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            onClick={() => setSelected(prescription)}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-smooth hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold text-foreground">
                {prescription.medicines.length > 0
                  ? prescription.medicines.map((m) => m.name).join(", ")
                  : "Prescription"}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {prescription.medicines.length}{" "}
                {prescription.medicines.length === 1 ? "medicine" : "medicines"}
                {prescription.instructions
                  ? ` · ${prescription.instructions}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge
                label={prescription.status}
                tone={statusToneForPrescription(prescription.status)}
              />
              <p className="text-xs text-muted-foreground">
                {formatDate(prescription.date)}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Prescription</DialogTitle>
            <DialogDescription>
              {selected ? formatDateTime(selected.date) : ""}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="grid gap-5">
              <div>
                <StatusBadge
                  label={selected.status}
                  tone={statusToneForPrescription(selected.status)}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Medicines
                </p>
                {selected.medicines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No medicines listed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selected.medicines.map((medicine) => (
                      <div
                        key={medicine.id.toString()}
                        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Pill className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {medicine.name}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {medicine.dosage}
                            {medicine.frequency
                              ? ` · ${medicine.frequency}`
                              : ""}
                            {medicine.duration ? ` · ${medicine.duration}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selected.instructions ? (
                <DetailRow label="Instructions">
                  {selected.instructions}
                </DetailRow>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PrescriptionsPage() {
  const profileQuery = useCallerPatientProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prescriptions"
        description="Your active and past prescriptions."
      />

      {profileQuery.isLoading ? (
        <div className="space-y-3" data-ocid="loading_state">
          {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
            <Skeleton key={id} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : profileQuery.isError ? (
        <div
          data-ocid="error_state"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-6 py-14 text-center"
        >
          <h3 className="font-display text-base font-semibold text-foreground">
            Couldn't load your profile
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            We couldn't verify your patient profile. Please try again.
          </p>
          <button
            type="button"
            data-ocid="retry_button"
            onClick={() => void profileQuery.refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : !profileQuery.data ? (
        <EmptyState
          icon={<Pill className="h-6 w-6" />}
          title="Complete your patient profile"
          description="Set up your patient profile to start viewing your prescriptions."
        />
      ) : (
        <PrescriptionsList patientId={profileQuery.data.userId} />
      )}
    </div>
  );
}
