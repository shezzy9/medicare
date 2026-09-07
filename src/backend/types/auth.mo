module {
  // Application-level role. Only Patient and Doctor are supported.
  public type Role = {
    #patient;
    #doctor;
  };

  // A registered user. `principal` is the Internet Identity-derived caller.
  public type User = {
    principal : Principal;
    role : Role;
    createdAt : Int;
  };

  public type Gender = {
    #male;
    #female;
    #other;
  };

  public type BloodGroup = {
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

  public type PatientProfile = {
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

  public type DoctorProfile = {
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
};
