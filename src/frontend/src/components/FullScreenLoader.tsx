import { Loader2 } from "lucide-react";

export function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      data-ocid="loading_state"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
