module {
  public type VitalSource = {
    #sensor;
    #manual;
  };

  public type Vital = {
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

  public type DeviceStatus = {
    #active;
    #inactive;
  };

  public type Device = {
    id : Nat;
    patientId : Principal;
    deviceName : Text;
    deviceType : Text;
    deviceTokenHash : Blob;
    status : DeviceStatus;
    lastSeenAt : ?Int;
    createdAt : Int;
  };

  public type TimeRange = {
    #h24;
    #d7;
    #d30;
    #m3;
    #m6;
    #y1;
  };

  public type VitalsError = {
    #notAuthorized;
    #deviceNotFound;
    #deviceInactive;
    #invalidToken;
    #invalidReading;
  };
};
