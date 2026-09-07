import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

import AuthTypes "types/auth";
import VitalsTypes "types/vitals";
import ClinicalTypes "types/clinical";
import NotificationTypes "types/notifications";

import AuthApi "mixins/auth-api";
import VitalsApi "mixins/vitals-api";
import ClinicalApi "mixins/clinical-api";
import NotificationsApi "mixins/notifications-api";
import ApiDocMixin "mixins/api-doc";

actor {
  // Authorization state owned by MixinAuthorization.
  let accessControlState : AccessControl.AccessControlState;

  // Auth domain state.
  let users : Map.Map<Principal, AuthTypes.User>;
  let patientProfiles : Map.Map<Principal, AuthTypes.PatientProfile>;
  let doctorProfiles : Map.Map<Principal, AuthTypes.DoctorProfile>;

  // Vitals domain state.
  let vitals : List.List<VitalsTypes.Vital>;
  let devices : List.List<VitalsTypes.Device>;
  let vitalState : { var nextVitalId : Nat };
  let deviceState : { var nextDeviceId : Nat };

  // Clinical domain state.
  let medicalHistory : List.List<ClinicalTypes.MedicalHistory>;
  let consultations : List.List<ClinicalTypes.Consultation>;
  let prescriptions : List.List<ClinicalTypes.Prescription>;
  let appointments : List.List<ClinicalTypes.Appointment>;
  let assignments : List.List<ClinicalTypes.DoctorPatientAssignment>;
  let clinicalState : { var nextClinicalId : Nat };

  // Notifications domain state.
  let notifications : List.List<NotificationTypes.Notification>;
  let notificationState : { var nextNotificationId : Nat };

  // Sample owner used only to seed OQL schema discovery; the value is ignored.
  transient let anyP = Principal.fromText("aaaaa-aa");

  // ---- OQL per-table authorization helpers ----

  func isDoctorUser(p : Principal) : Bool {
    switch (users.get(p)) {
      case (?u) u.role == #doctor;
      case null false;
    };
  };

  func isAssignedDoctorUser(doctorId : Principal, patientId : Principal) : Bool {
    assignments.any(func a = a.doctorId == doctorId and a.patientId == patientId);
  };

  // A patient sees their own rows; a doctor sees rows of patients assigned to
  // them. `owner` is the patientId column, which arrives as #text(principal).
  func canSeePatientData(caller : Principal, owner : OQL.Value) : Bool {
    switch (owner) {
      case (#text p) {
        if (p == caller.toText()) {
          true;
        } else {
          let patientId = Principal.fromText(p);
          isDoctorUser(caller) and isAssignedDoctorUser(caller, patientId);
        };
      };
      case _ { false };
    };
  };

  // A doctor sees their own assignments; a patient sees assignments where they
  // are the patient. `owner` is the doctorId column.
  func canSeeAssignment(caller : Principal, owner : OQL.Value) : Bool {
    switch (owner) {
      case (#text p) {
        if (p == caller.toText()) {
          true;
        } else {
          let doctorId = Principal.fromText(p);
          assignments.any(func a = a.doctorId == doctorId and a.patientId == caller);
        };
      };
      case _ { false };
    };
  };

  include MixinAuthorization(accessControlState, null);
  include AuthApi(accessControlState, users, patientProfiles, doctorProfiles);
  include VitalsApi(vitals, devices, vitalState, deviceState, users, assignments);
  include ClinicalApi(medicalHistory, consultations, prescriptions, appointments, assignments, clinicalState);
  include NotificationsApi(notifications, notificationState);
  include ApiDocMixin();
  include Expose({
    entities = [
      // Auth backing — private to the platform/agent; no end-user reads.
      users.toEntityManual("user", "User", "principal")
        .sample({ principal = anyP; role = #patient; createdAt = 0 })
        .payload("principal", func u = u.principal)
        .payload("role", func u = (switch (u.role) { case (#patient) "patient"; case (#doctor) "doctor" }))
        .payload("createdAt", func u = u.createdAt)
        .controllerOnly()
        .build(),
      // Patient profiles — a patient sees their own; a doctor sees assigned patients'.
      patientProfiles.toEntityManual("patientProfile", "PatientProfile", "userId")
        .sample({ userId = anyP; name = ""; age = 0; gender = #other; bloodGroup = #notSpecified; heightCm = null; weightKg = null; contact = ""; address = ""; emergencyContact = null; createdAt = 0; updatedAt = 0 })
        .payload("userId", func p = p.userId)
        .payload("name", func p = p.name)
        .payload("age", func p = p.age)
        .payload("gender", func p = (switch (p.gender) { case (#male) "male"; case (#female) "female"; case (#other) "other" }))
        .payload("bloodGroup", func p = (switch (p.bloodGroup) { case (#aPositive) "aPositive"; case (#aNegative) "aNegative"; case (#bPositive) "bPositive"; case (#bNegative) "bNegative"; case (#abPositive) "abPositive"; case (#abNegative) "abNegative"; case (#oPositive) "oPositive"; case (#oNegative) "oNegative"; case (#notSpecified) "notSpecified" }))
        .payload("heightCm", func p = (switch (p.heightCm) { case (?h) h; case null 0.0 }))
        .payload("weightKg", func p = (switch (p.weightKg) { case (?w) w; case null 0.0 }))
        .payload("contact", func p = p.contact)
        .payload("address", func p = p.address)
        .payload("emergencyContact", func p = (switch (p.emergencyContact) { case (?e) e; case null "" }))
        .payload("createdAt", func p = p.createdAt)
        .payload("updatedAt", func p = p.updatedAt)
        .ownedByWith("userId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Doctor profiles — a doctor sees their own profile.
      doctorProfiles.toEntityManual("doctorProfile", "DoctorProfile", "userId")
        .sample({ userId = anyP; name = ""; specialization = ""; licenseNumber = ""; contact = ""; email = null; bio = null; createdAt = 0; updatedAt = 0 })
        .payload("userId", func d = d.userId)
        .payload("name", func d = d.name)
        .payload("specialization", func d = d.specialization)
        .payload("licenseNumber", func d = d.licenseNumber)
        .payload("contact", func d = d.contact)
        .payload("email", func d = (switch (d.email) { case (?e) e; case null "" }))
        .payload("bio", func d = (switch (d.bio) { case (?b) b; case null "" }))
        .payload("createdAt", func d = d.createdAt)
        .payload("updatedAt", func d = d.updatedAt)
        .ownedBy("userId")
        .controllerOrScoped()
        .build(),
      // Vitals — patient sees own; doctor sees assigned patients'.
      vitals.toEntityManual("vital", "Vital", "id")
        .sample({ id = 0; patientId = anyP; heartRate = null; spo2 = null; temperature = null; systolicBP = null; diastolicBP = null; bloodSugar = null; weight = null; bmi = null; source = #manual; recordedAt = 0; createdAt = 0 })
        .payload("id", func v = v.id)
        .payload("patientId", func v = v.patientId)
        .payload("heartRate", func v = (switch (v.heartRate) { case (?h) h; case null 0 }))
        .payload("spo2", func v = (switch (v.spo2) { case (?s) s; case null 0 }))
        .payload("temperature", func v = (switch (v.temperature) { case (?t) t; case null 0.0 }))
        .payload("systolicBP", func v = (switch (v.systolicBP) { case (?s) s; case null 0 }))
        .payload("diastolicBP", func v = (switch (v.diastolicBP) { case (?d) d; case null 0 }))
        .payload("bloodSugar", func v = (switch (v.bloodSugar) { case (?b) b; case null 0.0 }))
        .payload("weight", func v = (switch (v.weight) { case (?w) w; case null 0.0 }))
        .payload("bmi", func v = (switch (v.bmi) { case (?b) b; case null 0.0 }))
        .payload("source", func v = (switch (v.source) { case (#sensor) "sensor"; case (#manual) "manual" }))
        .payload("recordedAt", func v = v.recordedAt)
        .payload("createdAt", func v = v.createdAt)
        .ownedByWith("patientId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Devices — patient sees own; doctor sees assigned patients'. The raw
      // device token hash is intentionally not exposed.
      devices.toEntityManual("device", "Device", "id")
        .sample({ id = 0; patientId = anyP; deviceName = ""; deviceType = ""; deviceTokenHash = ("\00" : Blob); status = #inactive; lastSeenAt = null; createdAt = 0 })
        .payload("id", func d = d.id)
        .payload("patientId", func d = d.patientId)
        .payload("deviceName", func d = d.deviceName)
        .payload("deviceType", func d = d.deviceType)
        .payload("status", func d = (switch (d.status) { case (#active) "active"; case (#inactive) "inactive" }))
        .payload("lastSeenAt", func d = (switch (d.lastSeenAt) { case (?t) t; case null 0 }))
        .payload("createdAt", func d = d.createdAt)
        .ownedByWith("patientId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Medical history — patient sees own; doctor sees assigned patients'.
      medicalHistory.toEntityManual("medicalHistory", "MedicalHistory", "id")
        .sample({ id = 0; patientId = anyP; condition = ""; diagnosis = ""; treatment = ""; date = 0; notes = ""; createdBy = anyP })
        .payload("id", func m = m.id)
        .payload("patientId", func m = m.patientId)
        .payload("condition", func m = m.condition)
        .payload("diagnosis", func m = m.diagnosis)
        .payload("treatment", func m = m.treatment)
        .payload("date", func m = m.date)
        .payload("notes", func m = m.notes)
        .payload("createdBy", func m = m.createdBy)
        .ownedByWith("patientId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Consultations — patient sees own; doctor sees assigned patients'.
      consultations.toEntityManual("consultation", "Consultation", "id")
        .sample({ id = 0; patientId = anyP; doctorId = anyP; date = 0; reason = ""; diagnosis = ""; notes = ""; status = #open; createdAt = 0 })
        .payload("id", func c = c.id)
        .payload("patientId", func c = c.patientId)
        .payload("doctorId", func c = c.doctorId)
        .payload("date", func c = c.date)
        .payload("reason", func c = c.reason)
        .payload("diagnosis", func c = c.diagnosis)
        .payload("notes", func c = c.notes)
        .payload("status", func c = (switch (c.status) { case (#open) "open"; case (#closed) "closed" }))
        .payload("createdAt", func c = c.createdAt)
        .ownedByWith("patientId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Prescriptions — patient sees own; doctor sees assigned patients'. The
      // medicines list is exposed as a count.
      prescriptions.toEntityManual("prescription", "Prescription", "id")
        .sample({ id = 0; patientId = anyP; doctorId = anyP; medicines = []; instructions = ""; date = 0; status = #active; createdAt = 0 })
        .payload("id", func p = p.id)
        .payload("patientId", func p = p.patientId)
        .payload("doctorId", func p = p.doctorId)
        .payload("medicineCount", func p = p.medicines.size())
        .payload("instructions", func p = p.instructions)
        .payload("date", func p = p.date)
        .payload("status", func p = (switch (p.status) { case (#active) "active"; case (#completed) "completed"; case (#cancelled) "cancelled" }))
        .payload("createdAt", func p = p.createdAt)
        .ownedByWith("patientId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Appointments — patient sees own; doctor sees assigned patients'.
      appointments.toEntityManual("appointment", "Appointment", "id")
        .sample({ id = 0; patientId = anyP; doctorId = anyP; date = 0; time = ""; reason = ""; status = #scheduled; notes = ""; createdAt = 0 })
        .payload("id", func a = a.id)
        .payload("patientId", func a = a.patientId)
        .payload("doctorId", func a = a.doctorId)
        .payload("date", func a = a.date)
        .payload("time", func a = a.time)
        .payload("reason", func a = a.reason)
        .payload("status", func a = (switch (a.status) { case (#scheduled) "scheduled"; case (#completed) "completed"; case (#cancelled) "cancelled" }))
        .payload("notes", func a = a.notes)
        .payload("createdAt", func a = a.createdAt)
        .ownedByWith("patientId", canSeePatientData)
        .controllerOrScoped()
        .build(),
      // Doctor-patient assignments — a doctor sees their own; a patient sees
      // assignments where they are the patient.
      assignments.toEntityManual("assignment", "DoctorPatientAssignment", "id")
        .sample({ id = 0; doctorId = anyP; patientId = anyP; assignedAt = 0 })
        .payload("id", func a = a.id)
        .payload("doctorId", func a = a.doctorId)
        .payload("patientId", func a = a.patientId)
        .payload("assignedAt", func a = a.assignedAt)
        .ownedByWith("doctorId", canSeeAssignment)
        .controllerOrScoped()
        .build(),
      // Notifications — a user sees only their own.
      notifications.toEntityManual("notification", "Notification", "id")
        .sample({ id = 0; userId = anyP; title = ""; message = ""; kind = #systemNotification; isRead = false; createdAt = 0 })
        .payload("id", func n = n.id)
        .payload("userId", func n = n.userId)
        .payload("title", func n = n.title)
        .payload("message", func n = n.message)
        .payload("kind", func n = (switch (n.kind) { case (#appointment) "appointment"; case (#consultation) "consultation"; case (#prescription) "prescription"; case (#vital) "vital"; case (#medicalHistory) "medicalHistory"; case (#device) "device"; case (#systemNotification) "systemNotification" }))
        .payload("isRead", func n = n.isRead)
        .payload("createdAt", func n = n.createdAt)
        .ownedBy("userId")
        .controllerOrScoped()
        .build(),
    ];
  });
};
