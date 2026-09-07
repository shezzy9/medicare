import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Types "../types/auth";

module {
  // Returns the persisted role for a caller, or null if the caller has not
  // completed first-sign-in role selection.
  public func getRole(users : Map.Map<Principal, Types.User>, caller : Principal) : ?Types.Role {
    switch (users.get(caller)) {
      case (?u) { ?u.role };
      case null { null };
    };
  };

  // Assigns a role to a caller at first sign-in. Traps if the caller already
  // has a role (role is immutable after selection).
  public func assignRole(users : Map.Map<Principal, Types.User>, caller : Principal, role : Types.Role, now : Int) : Types.User {
    switch (users.get(caller)) {
      case (?_) { Runtime.trap("Role already assigned: role is immutable after selection") };
      case null {
        let user : Types.User = {
          principal = caller;
          role;
          createdAt = now;
        };
        users.add(caller, user);
        user;
      };
    };
  };

  // Returns the persisted PatientProfile for a caller, or null.
  public func getPatientProfile(patientProfiles : Map.Map<Principal, Types.PatientProfile>, caller : Principal) : ?Types.PatientProfile {
    patientProfiles.get(caller);
  };

  // Creates or updates the caller's PatientProfile. The profile is always
  // bound to the caller's principal (backend-enforced ownership).
  public func savePatientProfile(patientProfiles : Map.Map<Principal, Types.PatientProfile>, caller : Principal, profile : Types.PatientProfile, now : Int) : Types.PatientProfile {
    let existing = patientProfiles.get(caller);
    let saved : Types.PatientProfile = {
      userId = caller;
      name = profile.name;
      age = profile.age;
      gender = profile.gender;
      bloodGroup = profile.bloodGroup;
      heightCm = profile.heightCm;
      weightKg = profile.weightKg;
      contact = profile.contact;
      address = profile.address;
      emergencyContact = profile.emergencyContact;
      createdAt = switch (existing) { case (?e) { e.createdAt }; case null { now } };
      updatedAt = now;
    };
    patientProfiles.add(caller, saved);
    saved;
  };

  // Returns the persisted DoctorProfile for a caller, or null.
  public func getDoctorProfile(doctorProfiles : Map.Map<Principal, Types.DoctorProfile>, caller : Principal) : ?Types.DoctorProfile {
    doctorProfiles.get(caller);
  };

  // Creates or updates the caller's DoctorProfile. The profile is always
  // bound to the caller's principal (backend-enforced ownership).
  public func saveDoctorProfile(doctorProfiles : Map.Map<Principal, Types.DoctorProfile>, caller : Principal, profile : Types.DoctorProfile, now : Int) : Types.DoctorProfile {
    let existing = doctorProfiles.get(caller);
    let saved : Types.DoctorProfile = {
      userId = caller;
      name = profile.name;
      specialization = profile.specialization;
      licenseNumber = profile.licenseNumber;
      contact = profile.contact;
      email = profile.email;
      bio = profile.bio;
      createdAt = switch (existing) { case (?e) { e.createdAt }; case null { now } };
      updatedAt = now;
    };
    doctorProfiles.add(caller, saved);
    saved;
  };
};
