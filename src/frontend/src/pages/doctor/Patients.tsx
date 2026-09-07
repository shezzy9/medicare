import { createActor } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAssignedPatients,
  useCallerDoctorProfile,
} from "@/hooks/useQueries";
import { formatRelativeTime, shortPrincipal } from "@/lib/api";
import type { Vital } from "@/lib/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, HeartPulse, Users } from "lucide-react";

function vitalSummary(vital: Vital | null): string {
  if (!vital) return "No readings yet";
  const parts: string[] = [];
  if (vital.heartRate != null) parts.push(`HR ${vital.heartRate}`);
  if (vital.systolicBP != null && vital.diastolicBP != null)
    parts.push(`BP ${vital.systolicBP}/${vital.diastolicBP}`);
  if (vital.spo2 != null) parts.push(`SpO₂ ${vital.spo2}%`);
  return parts.length > 0 ? parts.join(" · ") : "No readings yet";
}

export function PatientsPage() {
  const { actor, isFetching } = useActor(createActor);
  const { data: doctorProfile, isLoading: profileLoading } =
    useCallerDoctorProfile();
  const doctorId = doctorProfile?.userId ?? null;
  const {
    data: assignments = [],
    isLoading: assignmentsLoading,
    isError,
  } = useAssignedPatients(doctorId);

  const vitalsQueries = useQueries({
    queries: assignments.map((a) => ({
      queryKey: ["latestVitals", a.patientId],
      queryFn: async (): Promise<Vital | null> => {
        if (!actor) return null;
        const result = await actor.getLatestVitals(a.patientId);
        return result.__kind__ === "ok" ? result.ok : null;
      },
      enabled: !!actor && !isFetching && !!a.patientId,
    })),
  });

  const loading =
    profileLoading ||
    assignmentsLoading ||
    vitalsQueries.some((q) => q.isLoading);

  const rows = assignments.map((assignment, index) => {
    const vital = vitalsQueries[index]?.data ?? null;
    return { assignment, vital };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Patients assigned to your care, with their latest vitals at a glance."
        actions={
          <Button asChild data-ocid="dashboard_link">
            <Link to="/doctor">
              <HeartPulse className="mr-2 h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }, (_, i) => `sk-${i}`).map((id) => (
                <Skeleton key={id} className="h-14 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div data-ocid="error_state" className="p-10 text-center">
              <p className="font-medium text-destructive">
                We couldn't load your patients.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please try again in a moment.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="No patients assigned yet"
                description="Patients assigned to your care will appear here with their latest health readings."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Latest Vitals</TableHead>
                  <TableHead>Last Reading</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ assignment, vital }, index) => {
                  const pid = assignment.patientId.toString();
                  return (
                    <TableRow key={pid}>
                      <TableCell>
                        <Link
                          to="/doctor/patients/$patientId"
                          params={{ patientId: pid }}
                          data-ocid={`patient.link.${index + 1}`}
                          className="flex items-center gap-3"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {pid.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {shortPrincipal(pid)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Assigned{" "}
                              {formatRelativeTime(assignment.assignedAt)}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {vitalSummary(vital)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {vital ? formatRelativeTime(vital.recordedAt) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={vital ? "Monitoring" : "No data"}
                          tone={vital ? "success" : "neutral"}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to="/doctor/patients/$patientId"
                          params={{ patientId: pid }}
                          data-ocid={`patient.open.${index + 1}`}
                          aria-label={`Open patient ${shortPrincipal(pid)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
