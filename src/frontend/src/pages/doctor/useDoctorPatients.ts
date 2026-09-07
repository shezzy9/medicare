import {
  useAssignedPatients,
  useCallerDoctorProfile,
} from "@/hooks/useQueries";
import type { DoctorPatientAssignment } from "@/lib/types";
import { Principal } from "@icp-sdk/core/principal";
import { useEffect, useState } from "react";

// Anonymous principal used only to satisfy the hook's non-null parameter type.
// The assigned-patients query is disabled while the doctor profile is loading,
// so this fallback is never actually queried.
const FALLBACK_PRINCIPAL = Principal.fromText("2vxsx-fae");

/**
 * Shared doctor-portal data: the caller's doctor profile, the patients
 * assigned to them, and the currently selected patient. All doctor clinical
 * pages (consultations, prescriptions, appointments) operate on one assigned
 * patient at a time.
 */
export function useDoctorPatients() {
  const doctorProfile = useCallerDoctorProfile();
  const doctorId: Principal | null = doctorProfile.data?.userId ?? null;
  const assignments = useAssignedPatients(doctorId ?? FALLBACK_PRINCIPAL);
  const patients = assignments.data ?? [];

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Default to the first assigned patient once the list is available.
  useEffect(() => {
    if (selectedKey === null && patients.length > 0) {
      setSelectedKey(patients[0].patientId.toText());
    }
  }, [patients, selectedKey]);

  const selectedPatient =
    patients.find((p) => p.patientId.toText() === selectedKey) ?? null;

  return {
    doctorId,
    patients,
    selectedKey,
    setSelectedKey,
    selectedPatient,
    isLoading: doctorProfile.isLoading || assignments.isLoading,
    error: doctorProfile.error ?? assignments.error,
  };
}

/** Converts an `<input type="date">` value ("YYYY-MM-DD") to a nanosecond bigint. */
export function dateInputToTimestamp(value: string): bigint {
  const ms = new Date(`${value}T12:00:00`).getTime();
  return BigInt(Number.isNaN(ms) ? Date.now() : ms) * 1_000_000n;
}
