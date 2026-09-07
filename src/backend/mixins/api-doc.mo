mixin () {
  public query func getApiDoc() : async Text {
    "# MediCare+ Backend API

MediCare+ is a full-stack healthcare management system on the Internet Computer.
The backend is a single Motoko canister that persists users, patient and doctor
profiles, doctor-patient assignments, vitals, devices, medical history,
consultations, prescriptions, appointments, and notifications. All data survives
refresh and logout/login because it lives in the canister's stable storage.

This document describes the public API surface, its authentication and
authorization model, units and encodings, lifecycle rules, mutation retry
safety, and non-obvious integration gotchas.

## Public methods

### Authentication & access control

- `_internet_identity_sign_in_start() : async Blob` — begins an Internet
  Identity sign-in, returning a challenge blob for the frontend to present to
  the II flow.
- `_internet_identity_sign_in_finish() : async Result.Result<(), Error>` —
  completes the II sign-in and registers the caller in access control. The
  first signed-in caller to register becomes the admin; every later caller
  becomes a regular `#user`.
- `_initialize_access_control() : async ()` — registers the caller in access
  control. The first signed-in caller becomes `#admin`; subsequent callers
  become `#user`. Anonymous callers are ignored (not registered).
- `getCallerUserRole() : async UserRole` — returns the caller's access-control
  role (`#admin`, `#user`, or `#guest`). Anonymous callers get `#guest`.
- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` —
  assigns an access-control role to another principal. Admin-only; traps
  `Unauthorized: Only admins can assign user roles` for non-admins.
- `isCallerAdmin() : async Bool` — whether the caller is the access-control
  admin.

### Roles & profiles

- `getCallerRole() : async ?Role` — the caller's application role (`#patient`
  or `#doctor`), or `null` if not yet chosen. Anonymous callers get `null`.
- `assignCallerRole(role : Role) : async User` — assigns the caller's
  application role at first sign-in. Traps `Unauthorized: Please sign in before
  selecting a role` if the caller is not a registered `#user`.
- `getCallerPatientProfile() : async ?PatientProfile` — the caller's patient
  profile, or `null`. Traps `Unauthorized: Only patients can access patient
  profiles` for non-patients.
- `saveCallerPatientProfile(profile : PatientProfile) : async PatientProfile` —
  creates or updates the caller's patient profile. Same patient-only guard.
- `getCallerDoctorProfile() : async ?DoctorProfile` — the caller's doctor
  profile, or `null`. Traps `Unauthorized: Only doctors can access doctor
  profiles` for non-doctors.
- `saveCallerDoctorProfile(profile : DoctorProfile) : async DoctorProfile` —
  creates or updates the caller's doctor profile. Same doctor-only guard.

### Vitals & devices

- `addManualVital(heartRate, spo2, temperature, systolicBP, diastolicBP,
  bloodSugar, weight, bmi, recordedAt) : async Result.Result<Vital,
  VitalsError>` — a patient records their own vitals manually. Returns
  `#err(#notAuthorized)` for non-patients and `#err(#invalidReading)` when no
  reading is supplied.
- `ingestVitals(deviceToken : Blob, heartRate, spo2, temperature, recordedAt) :
  async Result.Result<Vital, VitalsError>` — authenticated ESP32 ingestion. The
  device authenticates with its token (hashed before storage). Returns
  `#err(#invalidToken)`, `#err(#deviceInactive)`, or `#err(#invalidReading)`.
- `getLatestVitals(patientId) : async Result.Result<?Vital, VitalsError>` — the
  patient's latest vital. Returns `#err(#notAuthorized)` unless the caller is
  the patient or an assigned doctor.
- `getVitalsHistory(patientId, range : TimeRange) : async
  Result.Result<[Vital], VitalsError>` — vitals within a time range. Same
  authorization.
- `registerDevice(deviceName, deviceType, deviceToken) : async
  Result.Result<Device, VitalsError>` — a patient registers a device bound to
  their own account. Returns `#err(#notAuthorized)` for non-patients and
  `#err(#invalidReading)` for empty name/type.
- `getDeviceStatus(patientId) : async Result.Result<?Device, VitalsError>` —
  the patient's device. Same authorization as vitals.

### Medical history

- `addMedicalHistory(patientId, condition, diagnosis, treatment, date, notes) :
  async MedicalHistory` — the patient or an assigned doctor adds a record.
  Traps `Not authorized` otherwise; traps `Condition is required` for an empty
  condition.
- `listMedicalHistory(patientId) : async [MedicalHistory]` — the patient or an
  assigned doctor lists the patient's records. Traps `Not authorized`.
- `getMedicalHistory(id) : async ?MedicalHistory` — a single record. Traps
  `Not authorized` unless the caller is the patient or an assigned doctor.

### Consultations

- `createConsultation(patientId, date, reason, diagnosis, notes) : async
  Consultation` — an assigned doctor creates a consultation. Traps `Not
  authorized` for non-assigned callers; traps `Reason is required` for an empty
  reason.
- `listConsultations(patientId) : async [Consultation]` — the patient or an
  assigned doctor lists the patient's consultations. Traps `Not authorized`.
- `getConsultation(id) : async ?Consultation` — a single consultation. Traps
  `Not authorized` unless the caller is the patient or an assigned doctor.

### Prescriptions

- `createPrescription(patientId, medicines, instructions, date) : async
  Prescription` — an assigned doctor creates a prescription. Traps `Not
  authorized` for non-assigned callers; traps `At least one medicine is
  required` for an empty medicines list.
- `listPrescriptions(patientId) : async [Prescription]` — the patient or an
  assigned doctor lists the patient's prescriptions. Traps `Not authorized`.
- `getPrescription(id) : async ?Prescription` — a single prescription. Traps
  `Not authorized` unless the caller is the patient or an assigned doctor.

### Appointments

- `bookAppointment(doctorId, date, time, reason, notes) : async Appointment` —
  a patient books an appointment with a doctor (the caller is the patient).
  Traps `Time is required` or `Reason is required` for empty fields.
- `cancelAppointment(id) : async Bool` — the patient or an assigned doctor
  cancels an appointment. Traps `Not authorized` otherwise. Returns `false` if
  the appointment does not exist.
- `listAppointments(patientId) : async [Appointment]` — the patient or an
  assigned doctor lists the patient's appointments. Traps `Not authorized`.
- `manageAppointment(id, status) : async Bool` — an assigned doctor updates an
  appointment's status. Traps `Not authorized` for non-assigned callers.
  Returns `false` if the appointment does not exist.

### Doctor-patient assignments

- `assignPatient(patientId) : async DoctorPatientAssignment` — a doctor assigns
  a patient to themselves. Traps `Patient already assigned` if already assigned.
- `listAssignedPatients(doctorId) : async [DoctorPatientAssignment]` — lists a
  doctor's assigned patients. Traps `Not authorized` unless the caller is that
  doctor.

### Notifications

- `createNotification(userId, title, message, kind) : async Notification` —
  internal helper used by other domains to notify users of events.
- `listMyNotifications() : async [Notification]` — the caller's notifications,
  newest first. A user can only ever see their own.
- `markNotificationAsRead(notificationId) : async Bool` — marks one of the
  caller's notifications as read. Returns `true` if it existed and belonged to
  the caller.
- `markAllNotificationsRead() : async ()` — marks all of the caller's
  notifications as read.
- `unreadNotificationCount() : async Nat` — the caller's unread count.

### Data intelligence (OQL)

- `schema() : async Text` — a JSON schema of the queryable entities, filtered
  by the caller's authorization.
- `execute(qJson : Text) : async Result` — runs a JSON OQL query against the
  queryable entities, honoring per-table authorization.

### Documentation

- `getApiDoc() : async Text` — this document.

## Authentication & identity

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding the
user's Internet Identity authorization derives the correct per-app principal
against that origin, for example `icp identity link web <name> --app <host>`.
Such a delegation acts with the user's full authority in this app until it
expires.

### Registration prerequisite

Access is gated by registration. A direct API caller must register before any
role-guarded call (guarded queries included) by calling
`_initialize_access_control` once as a signed-in caller. The first initializer
becomes the `#admin`; every subsequent caller becomes a `#user`. An anonymous
caller is ignored by registration and receives `#guest` from
`getCallerUserRole`. A signed-in but unregistered caller traps with
`User is not registered` on `getCallerUserRole`.

A caller can be unregistered while the app already knows it because
registration happens only when a caller signs in through the app's own
frontend. A principal that never did so is unregistered even when it belongs to
the app's owner, and a signed-in caller derived against a different origin is a
different principal than the one the frontend registered.

### Authorization boundaries

- **Patients** may read and write only their own records (profiles, vitals,
  medical history, consultations, prescriptions, appointments, devices,
  notifications).
- **Doctors** may read and write only records of patients assigned to them
  (via `assignPatient`), and may manage their own profile and assignments.
- **Anonymous** callers are denied all role-guarded and scoped operations.
- The **access-control admin** can assign access-control roles.

Authorization is enforced on the backend for every guarded method; it is never
relied on from the frontend.

## Units & encodings

- **Timestamps** (`createdAt`, `updatedAt`, `date`, `recordedAt`, `assignedAt`,
  `lastSeenAt`) are `Int` nanoseconds since the Unix epoch (`Time.now()`).
- **Principals** (`userId`, `patientId`, `doctorId`, `createdBy`, `principal`)
  are Internet Identity-derived `Principal` values.
- **Identifiers** (`id`) are monotonically increasing `Nat` values allocated per
  domain.
- **Optional readings** (`heartRate`, `spo2`, `systolicBP`, `diastolicBP`,
  `temperature`, `bloodSugar`, `weight`, `bmi`, `heightCm`, `weightKg`,
  `emergencyContact`, `email`, `bio`, `lastSeenAt`) are `?T`; `null` means the
  value was not recorded.
- **Variant fields** are encoded as text in the OQL schema: roles
  (`patient`/`doctor`), genders, blood groups, vital sources
  (`sensor`/`manual`), device statuses (`active`/`inactive`), consultation
  statuses (`open`/`closed`), prescription statuses
  (`active`/`completed`/`cancelled`), appointment statuses
  (`scheduled`/`completed`/`cancelled`), and notification kinds.
- **Device tokens** are hashed before storage; the raw token is never stored or
  exposed.

## Lifecycle & polling

- **Vitals** are append-only readings. `getVitalsHistory` filters by a
  `TimeRange` (`#h24`, `#d7`, `#d30`, `#m3`, `#m6`, `#y1`). Poll
  `getLatestVitals` for the newest reading; it returns `null` when the patient
  has no readings yet.
- **Appointments** transition through `#scheduled` → `#completed`/`#cancelled`.
  `manageAppointment` (doctor) and `cancelAppointment` (patient or doctor)
  change status.
- **Prescriptions** transition through `#active` → `#completed`/`#cancelled`.
- **Consultations** transition through `#open` → `#closed`.
- **Notifications** are created by backend domains; the frontend polls
  `unreadNotificationCount` and `listMyNotifications`.

## Mutation retry safety

- **Idempotent reads**: all `get*`/`list*` methods are queries and safe to
  repeat.
- **Duplicate writes are not silently merged.** `assignCallerRole` traps if the
  caller already has a role; `assignPatient` traps if the patient is already
  assigned. Retrying these after success fails loudly rather than duplicating.
- **Append-only records** (vitals, medical history, consultations,
  prescriptions, appointments, notifications) append a new record on each call;
  retrying a create produces a duplicate record with a new `id`. Callers should
  treat creates as non-idempotent and avoid blind retries.
- **Status updates** (`cancelAppointment`, `manageAppointment`,
  `markNotificationAsRead`, `markAllNotificationsRead`) are idempotent — setting
  an already-set status or marking an already-read notification is a no-op that
  returns the same result.

## Errors, traps, limits & gotchas

- **Traps vs results**: methods returning `Result.Result<_, VitalsError>`
  (vitals/device endpoints) report authorization and validation failures as
  `#err` variants. Most other guarded methods **trap** with a `Not authorized`
  or `Unauthorized: ...` message on authorization failure — a trap rolls back
  the whole message and reaches the caller as a reject, so callers should treat
  a reject as an authorization/validation failure.
- **Registration is required** before any role-guarded call; see the
  registration prerequisite above.
- **`assignCallerRole` requires a registered `#user`** — call
  `_initialize_access_control` first.
- **`bookAppointment` has no role guard** — any signed-in caller books for
  themselves as the patient.
- **`createNotification` has no caller guard** — it is an internal helper; the
  frontend should not rely on it for user-facing notification creation.
- **OQL scoping**: `schema()` and `execute()` hide entities and rows the caller
  cannot read. Patients see only their own rows; doctors see only assigned
  patients' rows; the platform controller sees everything. The raw device token
  hash is never exposed.
- **Hardware**: `ingestVitals` is the authenticated device-ingestion contract
  for ESP32 + MAX30100 (heart rate/SpO2) + DHT (temperature). Blood pressure and
  blood sugar are manual-entry values unless actual hardware measurement exists.
  HC-05 Bluetooth Classic is not directly supported by a normal browser.
"
  };
};
