import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCallerPatientProfile, useMedicalHistory } from "@/hooks/useQueries";
import { formatDate } from "@/lib/api";
import type { MedicalHistory } from "@/lib/types";
import type { Principal } from "@icp-sdk/core/principal";
import { FileText, History, RefreshCw, Stethoscope } from "lucide-react";
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

function MedicalHistoryList({ patientId }: { patientId: Principal }) {
  const { data, isLoading, isError, refetch } = useMedicalHistory(patientId);
  const [selected, setSelected] = useState<MedicalHistory | null>(null);

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
          Couldn't load your medical history
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Something went wrong while fetching your records. Please try again.
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
        icon={<History className="h-6 w-6" />}
        title="No medical history yet"
        description="Your conditions, diagnoses and treatments will appear here once a healthcare provider adds them."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {data.map((record, index) => (
          <motion.button
            key={record.id.toString()}
            type="button"
            data-ocid={`medical_history.item.${index + 1}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            onClick={() => setSelected(record)}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-smooth hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold text-foreground">
                {record.condition}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {record.diagnosis}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-foreground">
                {formatDate(record.date)}
              </p>
              <p className="text-xs text-muted-foreground">View details</p>
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
            <DialogTitle className="font-display">
              {selected?.condition}
            </DialogTitle>
            <DialogDescription>
              Recorded {selected ? formatDate(selected.date) : ""}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="grid gap-4">
              <DetailRow label="Diagnosis">{selected.diagnosis}</DetailRow>
              <DetailRow label="Treatment">{selected.treatment}</DetailRow>
              {selected.notes ? (
                <DetailRow label="Notes">{selected.notes}</DetailRow>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MedicalHistoryPage() {
  const profileQuery = useCallerPatientProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical History"
        description="Your conditions, diagnoses and treatments over time."
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
          icon={<History className="h-6 w-6" />}
          title="Complete your patient profile"
          description="Set up your patient profile to start viewing your medical history records."
        />
      ) : (
        <MedicalHistoryList patientId={profileQuery.data.userId} />
      )}
    </div>
  );
}
