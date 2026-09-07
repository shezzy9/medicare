import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  trend?: string;
  trendTone?: "up" | "down" | "neutral";
  sparkline?: ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  icon,
  trend,
  trendTone = "neutral",
  sparkline,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">
              {value}
              {unit ? (
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {unit}
                </span>
              ) : null}
            </p>
            {trend ? (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trendTone === "up" && "text-emerald-600",
                  trendTone === "down" && "text-red-600",
                  trendTone === "neutral" && "text-muted-foreground",
                )}
              >
                {trend}
              </p>
            ) : null}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        {sparkline ? <div className="mt-3 h-10">{sparkline}</div> : null}
      </CardContent>
    </Card>
  );
}
