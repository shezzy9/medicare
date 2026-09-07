import Types "../types/clinical";

module {
  // Medical history
  public func addMedicalHistory(
    records : Types.MedicalHistory,
    patientId : Principal,
    condition : Text,
    diagnosis : Text,
    treatment : Text,
    date : Int,
    notes : Text,
    createdBy : Principal,
  ) : Types.MedicalHistory {
    {
      id = records.id;
      patientId;
      condition;
      diagnosis;
      treatment;
      date;
      notes;
      createdBy;
    }
  };

  public func listMedicalHistory(records : [Types.MedicalHistory], patientId : Principal) : [Types.MedicalHistory] {
    records.filter(func m = m.patientId == patientId);
  };

  public func getMedicalHistory(records : [Types.MedicalHistory], id : Types.Id) : ?Types.MedicalHistory {
    records.find(func m = m.id == id);
  };

  // Consultations
  public func createConsultation(
    records : Types.Consultation,
    patientId : Principal,
    doctorId : Principal,
    date : Int,
    reason : Text,
    diagnosis : Text,
    notes : Text,
    status : Types.ConsultationStatus,
    createdAt : Int,
  ) : Types.Consultation {
    {
      id = records.id;
      patientId;
      doctorId;
      date;
      reason;
      diagnosis;
      notes;
      status;
      createdAt;
    }
  };

  public func listConsultations(records : [Types.Consultation], patientId : Principal) : [Types.Consultation] {
    records.filter(func c = c.patientId == patientId);
  };

  public func getConsultation(records : [Types.Consultation], id : Types.Id) : ?Types.Consultation {
    records.find(func c = c.id == id);
  };

  // Prescriptions
  public func createPrescription(
    records : Types.Prescription,
    patientId : Principal,
    doctorId : Principal,
    medicines : [Types.Medicine],
    instructions : Text,
    date : Int,
    status : Types.PrescriptionStatus,
    createdAt : Int,
  ) : Types.Prescription {
    {
      id = records.id;
      patientId;
      doctorId;
      medicines;
      instructions;
      date;
      status;
      createdAt;
    }
  };

  public func listPrescriptions(records : [Types.Prescription], patientId : Principal) : [Types.Prescription] {
    records.filter(func p = p.patientId == patientId);
  };

  public func getPrescription(records : [Types.Prescription], id : Types.Id) : ?Types.Prescription {
    records.find(func p = p.id == id);
  };

  // Appointments
  public func bookAppointment(
    records : Types.Appointment,
    patientId : Principal,
    doctorId : Principal,
    date : Int,
    time : Text,
    reason : Text,
    status : Types.AppointmentStatus,
    notes : Text,
    createdAt : Int,
  ) : Types.Appointment {
    {
      id = records.id;
      patientId;
      doctorId;
      date;
      time;
      reason;
      status;
      notes;
      createdAt;
    }
  };

  public func cancelAppointment(records : [Types.Appointment], id : Types.Id) : Bool {
    records.find(func a = a.id == id) != null;
  };

  public func listAppointments(records : [Types.Appointment], patientId : Principal) : [Types.Appointment] {
    records.filter(func a = a.patientId == patientId);
  };

  public func manageAppointment(records : [Types.Appointment], id : Types.Id, status : Types.AppointmentStatus) : Bool {
    ignore status;
    records.find(func a = a.id == id) != null;
  };

  // Doctor-patient assignments
  public func assignPatient(
    records : Types.DoctorPatientAssignment,
    doctorId : Principal,
    patientId : Principal,
    assignedAt : Int,
  ) : Types.DoctorPatientAssignment {
    {
      id = records.id;
      doctorId;
      patientId;
      assignedAt;
    }
  };

  public func listAssignedPatients(records : [Types.DoctorPatientAssignment], doctorId : Principal) : [Types.DoctorPatientAssignment] {
    records.filter(func a = a.doctorId == doctorId);
  };
};
