import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result_2 = {
    __kind__: "ok";
    ok: Array<Vital>;
} | {
    __kind__: "err";
    err: VitalsError;
};
export interface DoctorProfile {
    bio?: string;
    contact: string;
    userId: Principal;
    name: string;
    createdAt: bigint;
    email?: string;
    updatedAt: bigint;
    specialization: string;
    licenseNumber: string;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Vital {
    id: bigint;
    bmi?: number;
    weight?: number;
    source: VitalSource;
    patientId: Principal;
    temperature?: number;
    createdAt: bigint;
    spo2?: bigint;
    recordedAt: bigint;
    systolicBP?: bigint;
    bloodSugar?: number;
    diastolicBP?: bigint;
    heartRate?: bigint;
}
export type Result_1 = {
    __kind__: "ok";
    ok: Vital;
} | {
    __kind__: "err";
    err: VitalsError;
};
export type Result_5 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Result_4 = {
    __kind__: "ok";
    ok: Device | null;
} | {
    __kind__: "err";
    err: VitalsError;
};
export interface Cell {
    value: Value;
    name: string;
}
export interface PatientProfile {
    age: bigint;
    contact: string;
    heightCm?: number;
    userId: Principal;
    name: string;
    createdAt: bigint;
    emergencyContact?: string;
    updatedAt: bigint;
    weightKg?: number;
    bloodGroup: BloodGroup;
    address: string;
    gender: Gender;
}
export interface Medicine {
    id: Id;
    duration: string;
    dosage: string;
    name: string;
    frequency: string;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface Consultation {
    id: Id;
    status: ConsultationStatus;
    doctorId: Principal;
    patientId: Principal;
    date: bigint;
    createdAt: bigint;
    diagnosis: string;
    notes: string;
    reason: string;
}
export interface User {
    principal: Principal;
    createdAt: bigint;
    role: Role;
}
export interface MedicalHistory {
    id: Id;
    patientId: Principal;
    date: bigint;
    createdBy: Principal;
    treatment: string;
    diagnosis: string;
    notes: string;
    condition: string;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Device {
    id: bigint;
    status: DeviceStatus;
    deviceTokenHash: Uint8Array;
    lastSeenAt?: bigint;
    patientId: Principal;
    createdAt: bigint;
    deviceName: string;
    deviceType: string;
}
export interface DoctorPatientAssignment {
    id: Id;
    doctorId: Principal;
    assignedAt: bigint;
    patientId: Principal;
}
export type Result = {
    __kind__: "ok";
    ok: Device;
} | {
    __kind__: "err";
    err: VitalsError;
};
export type Result_3 = {
    __kind__: "ok";
    ok: Vital | null;
} | {
    __kind__: "err";
    err: VitalsError;
};
export type NotificationId = bigint;
export interface Notification {
    id: NotificationId;
    title: string;
    userId: Principal;
    kind: NotificationKind;
    createdAt: bigint;
    isRead: boolean;
    message: string;
}
export type Id = bigint;
export interface Appointment {
    id: Id;
    status: AppointmentStatus;
    doctorId: Principal;
    patientId: Principal;
    date: bigint;
    createdAt: bigint;
    time: string;
    notes: string;
    reason: string;
}
export interface Prescription {
    id: Id;
    status: PrescriptionStatus;
    doctorId: Principal;
    patientId: Principal;
    date: bigint;
    createdAt: bigint;
    instructions: string;
    medicines: Array<Medicine>;
}
export enum AppointmentStatus {
    scheduled = "scheduled",
    cancelled = "cancelled",
    completed = "completed"
}
export enum BloodGroup {
    aNegative = "aNegative",
    oPositive = "oPositive",
    abPositive = "abPositive",
    notSpecified = "notSpecified",
    bPositive = "bPositive",
    aPositive = "aPositive",
    oNegative = "oNegative",
    abNegative = "abNegative",
    bNegative = "bNegative"
}
export enum ConsultationStatus {
    closed = "closed",
    open = "open"
}
export enum DeviceStatus {
    active = "active",
    inactive = "inactive"
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum NotificationKind {
    appointment = "appointment",
    prescription = "prescription",
    vital = "vital",
    device = "device",
    medicalHistory = "medicalHistory",
    systemNotification = "systemNotification",
    consultation = "consultation"
}
export enum PrescriptionStatus {
    active = "active",
    cancelled = "cancelled",
    completed = "completed"
}
export enum Role {
    patient = "patient",
    doctor = "doctor"
}
export enum TimeRange {
    d7 = "d7",
    m3 = "m3",
    m6 = "m6",
    y1 = "y1",
    d30 = "d30",
    h24 = "h24"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VitalSource {
    sensor = "sensor",
    manual = "manual"
}
export enum VitalsError {
    notAuthorized = "notAuthorized",
    deviceInactive = "deviceInactive",
    invalidToken = "invalidToken",
    deviceNotFound = "deviceNotFound",
    invalidReading = "invalidReading"
}
export interface backendInterface {
    addManualVital(heartRate: bigint | null, spo2: bigint | null, temperature: number | null, systolicBP: bigint | null, diastolicBP: bigint | null, bloodSugar: number | null, weight: number | null, bmi: number | null, recordedAt: bigint): Promise<Result_1>;
    addMedicalHistory(patientId: Principal, condition: string, diagnosis: string, treatment: string, date: bigint, notes: string): Promise<MedicalHistory>;
    assignCallerRole(role: Role): Promise<User>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignPatient(patientId: Principal): Promise<DoctorPatientAssignment>;
    bookAppointment(doctorId: Principal, date: bigint, time: string, reason: string, notes: string): Promise<Appointment>;
    cancelAppointment(id: Id): Promise<boolean>;
    createConsultation(patientId: Principal, date: bigint, reason: string, diagnosis: string, notes: string): Promise<Consultation>;
    createNotification(userId: Principal, title: string, message: string, kind: NotificationKind): Promise<Notification>;
    createPrescription(patientId: Principal, medicines: Array<Medicine>, instructions: string, date: bigint): Promise<Prescription>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerDoctorProfile(): Promise<DoctorProfile | null>;
    getCallerPatientProfile(): Promise<PatientProfile | null>;
    getCallerRole(): Promise<Role | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConsultation(id: Id): Promise<Consultation | null>;
    getDeviceStatus(patientId: Principal): Promise<Result_4>;
    getLatestVitals(patientId: Principal): Promise<Result_3>;
    getMedicalHistory(id: Id): Promise<MedicalHistory | null>;
    getPrescription(id: Id): Promise<Prescription | null>;
    getVitalsHistory(patientId: Principal, range: TimeRange): Promise<Result_2>;
    ingestVitals(deviceToken: Uint8Array, heartRate: bigint | null, spo2: bigint | null, temperature: number | null, recordedAt: bigint): Promise<Result_1>;
    isCallerAdmin(): Promise<boolean>;
    listAppointments(patientId: Principal): Promise<Array<Appointment>>;
    listAssignedPatients(doctorId: Principal): Promise<Array<DoctorPatientAssignment>>;
    listConsultations(patientId: Principal): Promise<Array<Consultation>>;
    listMedicalHistory(patientId: Principal): Promise<Array<MedicalHistory>>;
    listMyNotifications(): Promise<Array<Notification>>;
    listPrescriptions(patientId: Principal): Promise<Array<Prescription>>;
    manageAppointment(id: Id, status: AppointmentStatus): Promise<boolean>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationAsRead(notificationId: NotificationId): Promise<boolean>;
    registerDevice(deviceName: string, deviceType: string, deviceToken: Uint8Array): Promise<Result>;
    saveCallerDoctorProfile(profile: DoctorProfile): Promise<DoctorProfile>;
    saveCallerPatientProfile(profile: PatientProfile): Promise<PatientProfile>;
    schema(): Promise<string>;
    unreadNotificationCount(): Promise<bigint>;
}
