import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shortPrincipal } from "@/lib/api";
import type { DoctorPatientAssignment } from "@/lib/types";
import { Users } from "lucide-react";

/**
 * Dropdown for choosing one of the doctor's assigned patients. Used by the
 * consultations, prescriptions, and appointments pages.
 */
export function DoctorPatientSelector({
  patients,
  value,
  onChange,
}: {
  patients: DoctorPatientAssignment[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger
          data-ocid="patient_select"
          className="w-[230px]"
          aria-label="Select patient"
        >
          <SelectValue placeholder="Select a patient" />
        </SelectTrigger>
        <SelectContent>
          {patients.map((p) => (
            <SelectItem key={p.patientId.toText()} value={p.patientId.toText()}>
              Patient {shortPrincipal(p.patientId.toText())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
