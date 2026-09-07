import { TimeRange, VitalSource } from "@/backend";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVitalsHistory } from "@/hooks/useQueries";
import { formatDateTime, timestampToDate } from "@/lib/api";
import type { Vital } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { Activity, LineChart as LineChartIcon } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RANGES: { key: TimeRange; label: string }[] = [
  { key: TimeRange.h24, label: "24h" },
  { key: TimeRange.d7, label: "7d" },
  { key: TimeRange.d30, label: "30d" },
  { key: TimeRange.m3, label: "3m" },
  { key: TimeRange.m6, label: "6m" },
  { key: TimeRange.y1, label: "1y" },
];

interface ChartPoint {
  time: string;
  heartRate?: number;
  spo2?: number;
  temperature?: number;
}

function buildChartData(vitals: Vital[]): ChartPoint[] {
  const points: ChartPoint[] = [];
  for (const v of vitals) {
    const d = timestampToDate(v.recordedAt);
    if (!d) continue;
    points.push({
      time: d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      heartRate: v.heartRate !== undefined ? Number(v.heartRate) : undefined,
      spo2: v.spo2 !== undefined ? Number(v.spo2) : undefined,
      temperature: v.temperature !== undefined ? v.temperature : undefined,
    });
  }
  return points.sort((a, b) => a.time.localeCompare(b.time));
}

export function VitalsHistoryPage() {
  const { identity } = useInternetIdentity();
  const patientId = identity?.getPrincipal() ?? Principal.anonymous();

  const [range, setRange] = useState<TimeRange>(TimeRange.d7);
  const historyQuery = useVitalsHistory(patientId, range);

  const vitals = historyQuery.data ?? [];
  const chartData = buildChartData(vitals);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vitals History"
        description="Explore trends in your vitals over time."
        actions={
          <div
            data-ocid="vitals.range_toggle"
            className="flex items-center gap-1 rounded-lg border border-border bg-card p-1"
          >
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                data-ocid={`vitals.range.${r.key}`}
                onClick={() => setRange(r.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-smooth",
                  range === r.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-primary" />
            Vitals trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={<LineChartIcon className="h-6 w-6" />}
              title="No data for this period"
              description="There are no recorded vitals in the selected time range. Try a different range or add a reading from My Vitals."
            />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart rate (bpm)"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="spo2"
                    name="SpO₂ (%)"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temp (°C)"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Reading history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : vitals.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="No readings recorded"
              description="Your recorded vitals will appear here as a table you can scan at a glance."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date &amp; time</TableHead>
                    <TableHead className="text-right">Heart rate</TableHead>
                    <TableHead className="text-right">SpO₂</TableHead>
                    <TableHead className="text-right">Temp</TableHead>
                    <TableHead className="text-right">Blood pressure</TableHead>
                    <TableHead className="text-right">Blood sugar</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitals.map((v) => (
                    <TableRow key={v.id.toString()}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(v.recordedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.heartRate !== undefined ? `${v.heartRate} bpm` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.spo2 !== undefined ? `${v.spo2}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.temperature !== undefined
                          ? `${v.temperature}°C`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.systolicBP !== undefined &&
                        v.diastolicBP !== undefined
                          ? `${v.systolicBP}/${v.diastolicBP}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.bloodSugar !== undefined
                          ? `${v.bloodSugar} mg/dL`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.weight !== undefined ? `${v.weight} kg` : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={
                            v.source === VitalSource.manual
                              ? "Manual"
                              : "Device"
                          }
                          tone={
                            v.source === VitalSource.manual ? "info" : "success"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
