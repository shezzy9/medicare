import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // ---- Old actor: empty (fresh install, first migration in the chain) ----
  type OldActor = {};

  // ---- New actor: every stable field declared in main.mo ----

  // Authorization state (owned by MixinAuthorization).
  type UserRole = {
    #admin;
    #user;
    #guest;
  };
  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  // Auth domain.
  type Role = {
    #patient;
    #doctor;
  };
  type User = {
    principal : Principal;
    role : Role;
    createdAt : Int;
  };
  type Gender = {
    #male;
    #female;
    #other;
  };
  type BloodGroup = {
    #aPositive;
    #aNegative;
    #bPositive;
    #bNegative;
    #abPositive;
    #abNegative;
    #oPositive;
    #oNegative;
    #notSpecified;
  };
  type PatientProfile = {
    userId : Principal;
    name : Text;
    age : Nat;
    gender : Gender;
    bloodGroup : BloodGroup;
    heightCm : ?Float;
    weightKg : ?Float;
    contact : Text;
    address : Text;
    emergencyContact : ?Text;
    createdAt : Int;
    updatedAt : Int;
  };
  type DoctorProfile = {
    userId : Principal;
    name : Text;
    specialization : Text;
    licenseNumber : Text;
    contact : Text;
    email : ?Text;
    bio : ?Text;
    createdAt : Int;
    updatedAt : Int;
  };

  // Vitals domain.
  type VitalSource = {
    #sensor;
    #manual;
  };
  type Vital = {
    id : Nat;
    patientId : Principal;
    heartRate : ?Nat;
    spo2 : ?Nat;
    temperature : ?Float;
    systolicBP : ?Nat;
    diastolicBP : ?Nat;
    bloodSugar : ?Float;
    weight : ?Float;
    bmi : ?Float;
    source : VitalSource;
    recordedAt : Int;
    createdAt : Int;
  };
  type DeviceStatus = {
    #active;
    #inactive;
  };
  type Device = {
    id : Nat;
    patientId : Principal;
    deviceName : Text;
    deviceType : Text;
    deviceTokenHash : Blob;
    status : DeviceStatus;
    lastSeenAt : ?Int;
    createdAt : Int;
  };

  // Clinical domain.
  type Id = Nat;
  type MedicalHistory = {
    id : Id;
    patientId : Principal;
    condition : Text;
    diagnosis : Text;
    treatment : Text;
    date : Int;
    notes : Text;
    createdBy : Principal;
  };
  type ConsultationStatus = {
    #open;
    #closed;
  };
  type Consultation = {
    id : Id;
    patientId : Principal;
    doctorId : Principal;
    date : Int;
    reason : Text;
    diagnosis : Text;
    notes : Text;
    status : ConsultationStatus;
    createdAt : Int;
  };
  type Medicine = {
    id : Id;
    name : Text;
    dosage : Text;
    frequency : Text;
    duration : Text;
  };
  type PrescriptionStatus = {
    #active;
    #completed;
    #cancelled;
  };
  type Prescription = {
    id : Id;
    patientId : Principal;
    doctorId : Principal;
    medicines : [Medicine];
    instructions : Text;
    date : Int;
    status : PrescriptionStatus;
    createdAt : Int;
  };
  type AppointmentStatus = {
    #scheduled;
    #completed;
    #cancelled;
  };
  type Appointment = {
    id : Id;
    patientId : Principal;
    doctorId : Principal;
    date : Int;
    time : Text;
    reason : Text;
    status : AppointmentStatus;
    notes : Text;
    createdAt : Int;
  };
  type DoctorPatientAssignment = {
    id : Id;
    doctorId : Principal;
    patientId : Principal;
    assignedAt : Int;
  };

  // Notifications domain.
  type NotificationKind = {
    #appointment;
    #consultation;
    #prescription;
    #vital;
    #medicalHistory;
    #device;
    #systemNotification;
  };
  type Notification = {
    id : Nat;
    userId : Principal;
    title : Text;
    message : Text;
    kind : NotificationKind;
    isRead : Bool;
    createdAt : Int;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    users : Map.Map<Principal, User>;
    patientProfiles : Map.Map<Principal, PatientProfile>;
    doctorProfiles : Map.Map<Principal, DoctorProfile>;
    vitals : List.List<Vital>;
    devices : List.List<Device>;
    vitalState : { var nextVitalId : Nat };
    deviceState : { var nextDeviceId : Nat };
    medicalHistory : List.List<MedicalHistory>;
    consultations : List.List<Consultation>;
    prescriptions : List.List<Prescription>;
    appointments : List.List<Appointment>;
    assignments : List.List<DoctorPatientAssignment>;
    clinicalState : { var nextClinicalId : Nat };
    notifications : List.List<Notification>;
    notificationState : { var nextNotificationId : Nat };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      users = Map.empty();
      patientProfiles = Map.empty();
      doctorProfiles = Map.empty();
      vitals = List.empty();
      devices = List.empty();
      vitalState = { var nextVitalId = 0 };
      deviceState = { var nextDeviceId = 0 };
      medicalHistory = List.empty();
      consultations = List.empty();
      prescriptions = List.empty();
      appointments = List.empty();
      assignments = List.empty();
      clinicalState = { var nextClinicalId = 0 };
      notifications = List.empty();
      notificationState = { var nextNotificationId = 0 };
    };
  };
};
