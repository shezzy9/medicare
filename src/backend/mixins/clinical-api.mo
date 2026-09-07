import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/clinical";

mixin (
  medicalHistory : List.List<Types.MedicalHistory>,
  consultations : List.List<Types.Consultation>,
  prescriptions : List.List<Types.Prescription>,
  appointments : List.List<Types.Appointment>,
  assignments : List.List<Types.DoctorPatientAssignment>,
  clinicalState : { var nextClinicalId : Nat },
) {
  // True when `doctorId` is a doctor currently assigned to `patientId`.
  func isAssignedDoctor(doctorId : Principal, patientId : Principal) : Bool {
    assignments.any(func a = a.doctorId == doctorId and a.patientId == patientId);
  };

  // Allocates the next clinical record id.
  func nextId() : Nat {
    let id = clinicalState.nextClinicalId;
    clinicalState.nextClinicalId += 1;
    id
  };

  func findAppointment(id : Types.Id) : ?Types.Appointment {
    appointments.find(func a = a.id == id);
  };

  // Replaces the status of the appointment with `id`, returning whether it existed.
  func updateAppointmentStatus(id : Types.Id, status : Types.AppointmentStatus) : Bool {
    let snapshot = appointments.toArray();
    appointments.clear();
    var updated = false;
    for (a in snapshot.values()) {
      if (a.id == id) {
        let updatedAppt : Types.Appointment = {
          id = a.id;
          patientId = a.patientId;
          doctorId = a.doctorId;
          date = a.date;
          time = a.time;
          reason = a.reason;
          status = status;
          notes = a.notes;
          createdAt = a.createdAt;
        };
        appointments.add(updatedAppt);
        updated := true;
      } else {
        appointments.add(a);
      };
    };
    updated
  };

  // Medical history
  public shared ({ caller }) func addMedicalHistory(
    patientId : Principal,
    condition : Text,
    diagnosis : Text,
    treatment : Text,
    date : Int,
    notes : Text,
  ) : async Types.MedicalHistory {
    if (not (caller == patientId or isAssignedDoctor(caller, patientId))) {
      Runtime.trap("Not authorized");
    };
    if (condition == "") {
      Runtime.trap("Condition is required");
    };
    let record : Types.MedicalHistory = {
      id = nextId();
      patientId;
      condition;
      diagnosis;
      treatment;
      date;
      notes;
      createdBy = caller;
    };
    medicalHistory.add(record);
    record
  };

  public query ({ caller }) func listMedicalHistory(patientId : Principal) : async [Types.MedicalHistory] {
    if (not (caller == patientId or isAssignedDoctor(caller, patientId))) {
      Runtime.trap("Not authorized");
    };
    medicalHistory.toArray().filter(func m = m.patientId == patientId)
  };

  public query ({ caller }) func getMedicalHistory(id : Types.Id) : async ?Types.MedicalHistory {
    switch (medicalHistory.toArray().find(func m = m.id == id)) {
      case (?r) {
        if (not (caller == r.patientId or isAssignedDoctor(caller, r.patientId))) {
          Runtime.trap("Not authorized");
        };
        ?r
      };
      case null { null };
    };
  };

  // Consultations
  public shared ({ caller }) func createConsultation(
    patientId : Principal,
    date : Int,
    reason : Text,
    diagnosis : Text,
    notes : Text,
  ) : async Types.Consultation {
    if (not isAssignedDoctor(caller, patientId)) {
      Runtime.trap("Not authorized");
    };
    if (reason == "") {
      Runtime.trap("Reason is required");
    };
    let record : Types.Consultation = {
      id = nextId();
      patientId;
      doctorId = caller;
      date;
      reason;
      diagnosis;
      notes;
      status = #open;
      createdAt = Time.now();
    };
    consultations.add(record);
    record
  };

  public query ({ caller }) func listConsultations(patientId : Principal) : async [Types.Consultation] {
    if (not (caller == patientId or isAssignedDoctor(caller, patientId))) {
      Runtime.trap("Not authorized");
    };
    consultations.toArray().filter(func c = c.patientId == patientId)
  };

  public query ({ caller }) func getConsultation(id : Types.Id) : async ?Types.Consultation {
    switch (consultations.toArray().find(func c = c.id == id)) {
      case (?r) {
        if (not (caller == r.patientId or isAssignedDoctor(caller, r.patientId))) {
          Runtime.trap("Not authorized");
        };
        ?r
      };
      case null { null };
    };
  };

  // Prescriptions
  public shared ({ caller }) func createPrescription(
    patientId : Principal,
    medicines : [Types.Medicine],
    instructions : Text,
    date : Int,
  ) : async Types.Prescription {
    if (not isAssignedDoctor(caller, patientId)) {
      Runtime.trap("Not authorized");
    };
    if (medicines.size() == 0) {
      Runtime.trap("At least one medicine is required");
    };
    let record : Types.Prescription = {
      id = nextId();
      patientId;
      doctorId = caller;
      medicines;
      instructions;
      date;
      status = #active;
      createdAt = Time.now();
    };
    prescriptions.add(record);
    record
  };

  public query ({ caller }) func listPrescriptions(patientId : Principal) : async [Types.Prescription] {
    if (not (caller == patientId or isAssignedDoctor(caller, patientId))) {
      Runtime.trap("Not authorized");
    };
    prescriptions.toArray().filter(func p = p.patientId == patientId)
  };

  public query ({ caller }) func getPrescription(id : Types.Id) : async ?Types.Prescription {
    switch (prescriptions.toArray().find(func p = p.id == id)) {
      case (?r) {
        if (not (caller == r.patientId or isAssignedDoctor(caller, r.patientId))) {
          Runtime.trap("Not authorized");
        };
        ?r
      };
      case null { null };
    };
  };

  // Appointments
  public shared ({ caller }) func bookAppointment(
    doctorId : Principal,
    date : Int,
    time : Text,
    reason : Text,
    notes : Text,
  ) : async Types.Appointment {
    if (time == "") {
      Runtime.trap("Time is required");
    };
    if (reason == "") {
      Runtime.trap("Reason is required");
    };
    let record : Types.Appointment = {
      id = nextId();
      patientId = caller;
      doctorId;
      date;
      time;
      reason;
      status = #scheduled;
      notes;
      createdAt = Time.now();
    };
    appointments.add(record);
    record
  };

  public shared ({ caller }) func cancelAppointment(id : Types.Id) : async Bool {
    switch (findAppointment(id)) {
      case (?r) {
        if (not (caller == r.patientId or isAssignedDoctor(caller, r.patientId))) {
          Runtime.trap("Not authorized");
        };
        updateAppointmentStatus(id, #cancelled)
      };
      case null { false };
    };
  };

  public query ({ caller }) func listAppointments(patientId : Principal) : async [Types.Appointment] {
    if (not (caller == patientId or isAssignedDoctor(caller, patientId))) {
      Runtime.trap("Not authorized");
    };
    appointments.toArray().filter(func a = a.patientId == patientId)
  };

  public shared ({ caller }) func manageAppointment(id : Types.Id, status : Types.AppointmentStatus) : async Bool {
    switch (findAppointment(id)) {
      case (?r) {
        if (not isAssignedDoctor(caller, r.patientId)) {
          Runtime.trap("Not authorized");
        };
        updateAppointmentStatus(id, status)
      };
      case null { false };
    };
  };

  // Doctor-patient assignments
  public shared ({ caller }) func assignPatient(patientId : Principal) : async Types.DoctorPatientAssignment {
    if (assignments.any(func a = a.doctorId == caller and a.patientId == patientId)) {
      Runtime.trap("Patient already assigned");
    };
    let assignment : Types.DoctorPatientAssignment = {
      id = nextId();
      doctorId = caller;
      patientId;
      assignedAt = Time.now();
    };
    assignments.add(assignment);
    assignment
  };

  public query ({ caller }) func listAssignedPatients(doctorId : Principal) : async [Types.DoctorPatientAssignment] {
    if (caller != doctorId) {
      Runtime.trap("Not authorized");
    };
    assignments.toArray().filter(func a = a.doctorId == doctorId)
  };
};
