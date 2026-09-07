module {
  public type Id = Nat;

  public type MedicalHistory = {
    id : Id;
    patientId : Principal;
    condition : Text;
    diagnosis : Text;
    treatment : Text;
    date : Int;
    notes : Text;
    createdBy : Principal;
  };

  public type ConsultationStatus = {
    #open;
    #closed;
  };

  public type Consultation = {
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

  public type Medicine = {
    id : Id;
    name : Text;
    dosage : Text;
    frequency : Text;
    duration : Text;
  };

  public type PrescriptionStatus = {
    #active;
    #completed;
    #cancelled;
  };

  public type Prescription = {
    id : Id;
    patientId : Principal;
    doctorId : Principal;
    medicines : [Medicine];
    instructions : Text;
    date : Int;
    status : PrescriptionStatus;
    createdAt : Int;
  };

  public type AppointmentStatus = {
    #scheduled;
    #completed;
    #cancelled;
  };

  public type Appointment = {
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

  public type DoctorPatientAssignment = {
    id : Id;
    doctorId : Principal;
    patientId : Principal;
    assignedAt : Int;
  };
};
