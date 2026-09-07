import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  danger: "bg-red-500/10 text-red-600 border-red-500/20",
  info: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full font-medium capitalize",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </Badge>
  );
}

export function statusToneForAppointment(status: string): StatusTone {
  switch (status) {
    case "completed":
      return "success";
    case "scheduled":
      return "info";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function statusToneForPrescription(status: string): StatusTone {
  switch (status) {
    case "active":
      return "success";
    case "completed":
      return "info";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function statusToneForConsultation(status: string): StatusTone {
  return status === "open" ? "info" : "neutral";
}
