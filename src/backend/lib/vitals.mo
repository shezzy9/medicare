import Int "mo:core/Int";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/vitals";

module {
  // Creates a manual vital record owned by `patientId`. The caller (a patient)
  // supplies the readings; blood pressure and blood sugar are manual-entry
  // values with no hardware source.
  public func addManualVital(
    vitals : List.List<Types.Vital>,
    state : { var nextVitalId : Nat },
    patientId : Principal,
    heartRate : ?Nat,
    spo2 : ?Nat,
    temperature : ?Float,
    systolicBP : ?Nat,
    diastolicBP : ?Nat,
    bloodSugar : ?Float,
    weight : ?Float,
    bmi : ?Float,
    recordedAt : Int,
  ) : Types.Vital {
    let vital : Types.Vital = {
      id = state.nextVitalId;
      patientId;
      heartRate;
      spo2;
      temperature;
      systolicBP;
      diastolicBP;
      bloodSugar;
      weight;
      bmi;
      source = #manual;
      recordedAt;
      createdAt = Time.now();
    };
    state.nextVitalId += 1;
    vitals.add(vital);
    vital;
  };

  // Creates a sensor-sourced vital record for the device's bound patient.
  // Only heart rate, SpO2 and temperature come from hardware (MAX30100/DHT).
  public func ingestVitals(
    vitals : List.List<Types.Vital>,
    state : { var nextVitalId : Nat },
    patientId : Principal,
    heartRate : ?Nat,
    spo2 : ?Nat,
    temperature : ?Float,
    recordedAt : Int,
  ) : Types.Vital {
    let vital : Types.Vital = {
      id = state.nextVitalId;
      patientId;
      heartRate;
      spo2;
      temperature;
      systolicBP = null;
      diastolicBP = null;
      bloodSugar = null;
      weight = null;
      bmi = null;
      source = #sensor;
      recordedAt;
      createdAt = Time.now();
    };
    state.nextVitalId += 1;
    vitals.add(vital);
    vital;
  };

  // Returns the most recent vital record for the patient, or null if none.
  public func getLatestVitals(
    vitals : List.List<Types.Vital>,
    patientId : Principal,
  ) : ?Types.Vital {
    var latest : ?Types.Vital = null;
    for (v in vitals.toArray().values()) {
      if (v.patientId == patientId) {
        switch (latest) {
          case null { latest := ?v };
          case (?l) {
            if (v.recordedAt > l.recordedAt) { latest := ?v };
          };
        };
      };
    };
    latest;
  };

  // Returns the patient's vitals recorded within the given time range,
  // newest first.
  public func getVitalsHistory(
    vitals : List.List<Types.Vital>,
    patientId : Principal,
    range : Types.TimeRange,
  ) : [Types.Vital] {
    let cutoff = Time.now() - rangeDurationNs(range);
    let filtered = vitals.toArray().filter(
      func v = v.patientId == patientId and v.recordedAt >= cutoff
    );
    filtered.sort(func (a, b) = Int.compare(b.recordedAt, a.recordedAt));
  };

  func rangeDurationNs(range : Types.TimeRange) : Int {
    switch (range) {
      case (#h24) Time.toNanoseconds(#hours(24)).toInt();
      case (#d7) Time.toNanoseconds(#days(7)).toInt();
      case (#d30) Time.toNanoseconds(#days(30)).toInt();
      case (#m3) Time.toNanoseconds(#days(90)).toInt();
      case (#m6) Time.toNanoseconds(#days(180)).toInt();
      case (#y1) Time.toNanoseconds(#days(365)).toInt();
    };
  };

  // Registers a device bound to the patient's account. The raw token is
  // hashed before storage; only the hash is persisted.
  public func registerDevice(
    devices : List.List<Types.Device>,
    state : { var nextDeviceId : Nat },
    patientId : Principal,
    deviceName : Text,
    deviceType : Text,
    deviceTokenHash : Blob,
  ) : Types.Device {
    let device : Types.Device = {
      id = state.nextDeviceId;
      patientId;
      deviceName;
      deviceType;
      deviceTokenHash;
      status = #active;
      lastSeenAt = null;
      createdAt = Time.now();
    };
    state.nextDeviceId += 1;
    devices.add(device);
    device;
  };

  // Returns the patient's registered device, or null if none.
  public func getDeviceStatus(
    devices : List.List<Types.Device>,
    patientId : Principal,
  ) : ?Types.Device {
    devices.find(func d = d.patientId == patientId);
  };

  // Looks up a device by its stored token hash. Used to authenticate an
  // ESP32 ingestion call.
  public func authenticateDevice(
    devices : List.List<Types.Device>,
    deviceTokenHash : Blob,
  ) : ?Types.Device {
    devices.find(func d = d.deviceTokenHash == deviceTokenHash);
  };

  // Records the last time a device successfully reported readings.
  public func markDeviceSeen(
    devices : List.List<Types.Device>,
    deviceId : Nat,
    seenAt : Int,
  ) {
    let snapshot = devices.toArray();
    devices.clear();
    for (d in snapshot.values()) {
      if (d.id == deviceId) {
        devices.add({ d with lastSeenAt = ?seenAt });
      } else {
        devices.add(d);
      };
    };
  };
};
