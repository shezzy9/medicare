import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Types "../types/vitals";
import AuthTypes "../types/auth";
import ClinicalTypes "../types/clinical";
import VitalsLib "../lib/vitals";

mixin (
  vitals : List.List<Types.Vital>,
  devices : List.List<Types.Device>,
  vitalState : { var nextVitalId : Nat },
  deviceState : { var nextDeviceId : Nat },
  users : Map.Map<Principal, AuthTypes.User>,
  assignments : List.List<ClinicalTypes.DoctorPatientAssignment>,
) {
  // Converts a Nat32 token hash into a fixed 4-byte Blob for storage.
  func tokenHashToBlob(h : Nat32) : Blob {
    let n = h.toNat();
    [n.toNat8(), (n / 256).toNat8(), (n / 65536).toNat8(), (n / 16777216).toNat8()].toBlob()
  };
  func isPatient(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (?u) u.role == #patient;
      case null false;
    };
  };

  func isDoctor(caller : Principal) : Bool {
    switch (users.get(caller)) {
      case (?u) u.role == #doctor;
      case null false;
    };
  };

  func isAssigned(doctorId : Principal, patientId : Principal) : Bool {
    assignments.find(func a = a.doctorId == doctorId and a.patientId == patientId) != null;
  };

  // A patient may view their own records; a doctor may view only assigned
  // patients' records.
  func canView(caller : Principal, patientId : Principal) : Bool {
    caller == patientId or (isDoctor(caller) and isAssigned(caller, patientId));
  };

  func hasAnyReading(
    hr : ?Nat,
    spo2 : ?Nat,
    temp : ?Float,
    sys : ?Nat,
    dia : ?Nat,
    sugar : ?Float,
    weight : ?Float,
    bmi : ?Float,
  ) : Bool {
    hr != null or spo2 != null or temp != null or sys != null or dia != null or sugar != null or weight != null or bmi != null;
  };

  // Physiologically plausible bounds for hardware-sourced readings.
  func sensorReadingsValid(hr : ?Nat, spo2 : ?Nat, temp : ?Float) : Bool {
    switch (hr) {
      case (?h) { if (h < 20 or h > 250) { return false } };
      case null {};
    };
    switch (spo2) {
      case (?s) { if (s > 100) { return false } };
      case null {};
    };
    switch (temp) {
      case (?t) { if (t < 30.0 or t > 45.0) { return false } };
      case null {};
    };
    true;
  };

  // A patient records their own vitals manually. Blood pressure and blood
  // sugar are manual-entry values (no hardware source).
  public shared ({ caller }) func addManualVital(
    heartRate : ?Nat,
    spo2 : ?Nat,
    temperature : ?Float,
    systolicBP : ?Nat,
    diastolicBP : ?Nat,
    bloodSugar : ?Float,
    weight : ?Float,
    bmi : ?Float,
    recordedAt : Int,
  ) : async Result.Result<Types.Vital, Types.VitalsError> {
    if (not isPatient(caller)) { return #err(#notAuthorized) };
    if (not hasAnyReading(heartRate, spo2, temperature, systolicBP, diastolicBP, bloodSugar, weight, bmi)) {
      return #err(#invalidReading);
    };
    #ok(VitalsLib.addManualVital(vitals, vitalState, caller, heartRate, spo2, temperature, systolicBP, diastolicBP, bloodSugar, weight, bmi, recordedAt));
  };

  // Authenticated ESP32 ingestion endpoint. The device authenticates with its
  // token (bound to a patient's account); readings are validated and persisted
  // as sensor-sourced vitals.
  public shared ({ caller }) func ingestVitals(
    deviceToken : Blob,
    heartRate : ?Nat,
    spo2 : ?Nat,
    temperature : ?Float,
    recordedAt : Int,
  ) : async Result.Result<Types.Vital, Types.VitalsError> {
    ignore caller;
    let tokenHash = tokenHashToBlob(deviceToken.hash());
    switch (VitalsLib.authenticateDevice(devices, tokenHash)) {
      case null { return #err(#invalidToken) };
      case (?device) {
        if (device.status != #active) { return #err(#deviceInactive) };
        if (heartRate == null and spo2 == null and temperature == null) {
          return #err(#invalidReading);
        };
        if (not sensorReadingsValid(heartRate, spo2, temperature)) {
          return #err(#invalidReading);
        };
        let vital = VitalsLib.ingestVitals(vitals, vitalState, device.patientId, heartRate, spo2, temperature, recordedAt);
        VitalsLib.markDeviceSeen(devices, device.id, Time.now());
        #ok(vital);
      };
    };
  };

  public query ({ caller }) func getLatestVitals(
    patientId : Principal,
  ) : async Result.Result<?Types.Vital, Types.VitalsError> {
    if (not canView(caller, patientId)) { return #err(#notAuthorized) };
    #ok(VitalsLib.getLatestVitals(vitals, patientId));
  };

  public query ({ caller }) func getVitalsHistory(
    patientId : Principal,
    range : Types.TimeRange,
  ) : async Result.Result<[Types.Vital], Types.VitalsError> {
    if (not canView(caller, patientId)) { return #err(#notAuthorized) };
    #ok(VitalsLib.getVitalsHistory(vitals, patientId, range));
  };

  // A patient registers a device bound to their own account. The raw token is
  // hashed before storage.
  public shared ({ caller }) func registerDevice(
    deviceName : Text,
    deviceType : Text,
    deviceToken : Blob,
  ) : async Result.Result<Types.Device, Types.VitalsError> {
    if (not isPatient(caller)) { return #err(#notAuthorized) };
    if (deviceName == "" or deviceType == "") { return #err(#invalidReading) };
    let tokenHash = tokenHashToBlob(deviceToken.hash());
    #ok(VitalsLib.registerDevice(devices, deviceState, caller, deviceName, deviceType, tokenHash));
  };

  public query ({ caller }) func getDeviceStatus(
    patientId : Principal,
  ) : async Result.Result<?Types.Device, Types.VitalsError> {
    if (not canView(caller, patientId)) { return #err(#notAuthorized) };
    #ok(VitalsLib.getDeviceStatus(devices, patientId));
  };
};
