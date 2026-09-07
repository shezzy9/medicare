import { createActor } from "@/backend";
import type {
  Appointment,
  AppointmentStatus,
  Consultation,
  Device,
  DoctorPatientAssignment,
  DoctorProfile,
  MedicalHistory,
  Medicine,
  Notification,
  NotificationKind,
  PatientProfile,
  Prescription,
  Role,
  TimeRange,
  Vital,
} from "@/lib/types";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useReadyActor() {
  const { actor, isFetching } = useActor(createActor);
  return { actor, isFetching };
}

// ---- Role & profiles ----

export function useCallerRole() {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async (): Promise<Role | null> => {
      if (!actor) return null;
      return actor.getCallerRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerPatientProfile() {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["callerPatientProfile"],
    queryFn: async (): Promise<PatientProfile | null> => {
      if (!actor) return null;
      return actor.getCallerPatientProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerDoctorProfile() {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["callerDoctorProfile"],
    queryFn: async (): Promise<DoctorProfile | null> => {
      if (!actor) return null;
      return actor.getCallerDoctorProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSavePatientProfile() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: PatientProfile) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveCallerPatientProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["callerPatientProfile"],
      });
    },
  });
}

export function useSaveDoctorProfile() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: DoctorProfile) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveCallerDoctorProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerDoctorProfile"] });
    },
  });
}

// ---- Vitals ----

export function useLatestVitals(patientId: Principal) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["latestVitals", patientId],
    queryFn: async (): Promise<Vital | null> => {
      if (!actor) return null;
      const result = await actor.getLatestVitals(patientId);
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useVitalsHistory(patientId: Principal, range: TimeRange) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["vitalsHistory", patientId, range],
    queryFn: async (): Promise<Vital[]> => {
      if (!actor) return [];
      const result = await actor.getVitalsHistory(patientId, range);
      return result.__kind__ === "ok" ? result.ok : [];
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useAddManualVital() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      heartRate: bigint | null;
      spo2: bigint | null;
      temperature: number | null;
      systolicBP: bigint | null;
      diastolicBP: bigint | null;
      bloodSugar: number | null;
      weight: number | null;
      bmi: number | null;
      recordedAt: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addManualVital(
        input.heartRate,
        input.spo2,
        input.temperature,
        input.systolicBP,
        input.diastolicBP,
        input.bloodSugar,
        input.weight,
        input.bmi,
        input.recordedAt,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["latestVitals"] });
      void queryClient.invalidateQueries({ queryKey: ["vitalsHistory"] });
    },
  });
}

// ---- Medical history ----

export function useMedicalHistory(patientId: Principal) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["medicalHistory", patientId],
    queryFn: async (): Promise<MedicalHistory[]> => {
      if (!actor) return [];
      return actor.listMedicalHistory(patientId);
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useAddMedicalHistory() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patientId: Principal;
      condition: string;
      diagnosis: string;
      treatment: string;
      date: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.addMedicalHistory(
        input.patientId,
        input.condition,
        input.diagnosis,
        input.treatment,
        input.date,
        input.notes,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["medicalHistory"] });
    },
  });
}

// ---- Consultations ----

export function useConsultations(patientId: Principal) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["consultations", patientId],
    queryFn: async (): Promise<Consultation[]> => {
      if (!actor) return [];
      return actor.listConsultations(patientId);
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useCreateConsultation() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patientId: Principal;
      date: bigint;
      reason: string;
      diagnosis: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createConsultation(
        input.patientId,
        input.date,
        input.reason,
        input.diagnosis,
        input.notes,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

// ---- Prescriptions ----

export function usePrescriptions(patientId: Principal) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["prescriptions", patientId],
    queryFn: async (): Promise<Prescription[]> => {
      if (!actor) return [];
      return actor.listPrescriptions(patientId);
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useCreatePrescription() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      patientId: Principal;
      medicines: Medicine[];
      instructions: string;
      date: bigint;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createPrescription(
        input.patientId,
        input.medicines,
        input.instructions,
        input.date,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  });
}

// ---- Appointments ----

export function useAppointments(patientId: Principal) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["appointments", patientId],
    queryFn: async (): Promise<Appointment[]> => {
      if (!actor) return [];
      return actor.listAppointments(patientId);
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useBookAppointment() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      doctorId: Principal;
      date: bigint;
      time: string;
      reason: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.bookAppointment(
        input.doctorId,
        input.date,
        input.time,
        input.reason,
        input.notes,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCancelAppointment() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.cancelAppointment(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useManageAppointment() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; status: AppointmentStatus }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.manageAppointment(input.id, input.status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// ---- Device ----

export function useDeviceStatus(patientId: Principal) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["deviceStatus", patientId],
    queryFn: async (): Promise<Device | null> => {
      if (!actor) return null;
      const result = await actor.getDeviceStatus(patientId);
      return result.__kind__ === "ok" ? result.ok : null;
    },
    enabled: !!actor && !isFetching && !!patientId,
  });
}

export function useRegisterDevice() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      deviceName: string;
      deviceType: string;
      deviceToken: Uint8Array;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.registerDevice(
        input.deviceName,
        input.deviceType,
        input.deviceToken,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["deviceStatus"] });
    },
  });
}

// ---- Doctor: assigned patients ----

export function useAssignedPatients(doctorId: Principal | null) {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["assignedPatients", doctorId],
    queryFn: async (): Promise<DoctorPatientAssignment[]> => {
      if (!actor || !doctorId) return [];
      return actor.listAssignedPatients(doctorId);
    },
    enabled: !!actor && !isFetching && !!doctorId,
  });
}

export function useAssignPatient() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patientId: Principal) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.assignPatient(patientId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignedPatients"] });
    },
  });
}

// ---- Notifications ----

export function useNotifications() {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      if (!actor) return [];
      return actor.listMyNotifications();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnreadNotificationCount() {
  const { actor, isFetching } = useReadyActor();
  return useQuery({
    queryKey: ["unreadNotificationCount"],
    queryFn: async (): Promise<bigint> => {
      if (!actor) return 0n;
      return actor.unreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkNotificationAsRead() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.markNotificationAsRead(notificationId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["unreadNotificationCount"],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["unreadNotificationCount"],
      });
    },
  });
}

export function useCreateNotification() {
  const { actor } = useReadyActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: Principal;
      title: string;
      message: string;
      kind: NotificationKind;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createNotification(
        input.userId,
        input.title,
        input.message,
        input.kind,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
