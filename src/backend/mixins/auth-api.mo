import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import AuthLib "../lib/auth";
import Types "../types/auth";

mixin (
  accessControlState : AccessControl.AccessControlState,
  users : Map.Map<Principal, Types.User>,
  patientProfiles : Map.Map<Principal, Types.PatientProfile>,
  doctorProfiles : Map.Map<Principal, Types.DoctorProfile>,
) {
  // Returns the caller's role, or null if the caller has not yet selected a
  // role at first sign-in. Anonymous callers return null.
  public query ({ caller }) func getCallerRole() : async ?Types.Role {
    AuthLib.getRole(users, caller);
  };

  // Assigns the caller's role at first sign-in. Traps if the caller already
  // has a role. Only #patient and #doctor are accepted (enforced by type).
  public shared ({ caller }) func assignCallerRole(role : Types.Role) : async Types.User {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Please sign in before selecting a role");
    };
    AuthLib.assignRole(users, caller, role, Time.now());
  };

  // Returns the caller's PatientProfile, or null. Traps if the caller is not
  // a patient.
  public query ({ caller }) func getCallerPatientProfile() : async ?Types.PatientProfile {
    if (AuthLib.getRole(users, caller) != ?#patient) {
      Runtime.trap("Unauthorized: Only patients can access patient profiles");
    };
    AuthLib.getPatientProfile(patientProfiles, caller);
  };

  // Creates or updates the caller's PatientProfile. Traps if the caller is
  // not a patient.
  public shared ({ caller }) func saveCallerPatientProfile(profile : Types.PatientProfile) : async Types.PatientProfile {
    if (AuthLib.getRole(users, caller) != ?#patient) {
      Runtime.trap("Unauthorized: Only patients can access patient profiles");
    };
    AuthLib.savePatientProfile(patientProfiles, caller, profile, Time.now());
  };

  // Returns the caller's DoctorProfile, or null. Traps if the caller is not
  // a doctor.
  public query ({ caller }) func getCallerDoctorProfile() : async ?Types.DoctorProfile {
    if (AuthLib.getRole(users, caller) != ?#doctor) {
      Runtime.trap("Unauthorized: Only doctors can access doctor profiles");
    };
    AuthLib.getDoctorProfile(doctorProfiles, caller);
  };

  // Creates or updates the caller's DoctorProfile. Traps if the caller is
  // not a doctor.
  public shared ({ caller }) func saveCallerDoctorProfile(profile : Types.DoctorProfile) : async Types.DoctorProfile {
    if (AuthLib.getRole(users, caller) != ?#doctor) {
      Runtime.trap("Unauthorized: Only doctors can access doctor profiles");
    };
    AuthLib.saveDoctorProfile(doctorProfiles, caller, profile, Time.now());
  };
};
