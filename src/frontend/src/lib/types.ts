// Shared domain types for MediCare+. Backend enums are values (used in
// switches and comparisons) so they are re-exported as values; interfaces and
// type aliases are re-exported as types.
export {
  AppointmentStatus,
  BloodGroup,
  ConsultationStatus,
  DeviceStatus,
  Gender,
  NotificationKind,
  PrescriptionStatus,
  Role,
  TimeRange,
  UserRole,
  VitalSource,
  VitalsError,
} from "@/backend";

export type {
  Appointment,
  Consultation,
  Device,
  DoctorPatientAssignment,
  DoctorProfile,
  MedicalHistory,
  Medicine,
  Notification,
  PatientProfile,
  Prescription,
  User,
  Vital,
} from "@/backend";
