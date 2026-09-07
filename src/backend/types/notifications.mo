import Principal "mo:core/Principal";

module {
  public type NotificationId = Nat;

  public type NotificationKind = {
    #appointment;
    #consultation;
    #prescription;
    #vital;
    #medicalHistory;
    #device;
    #systemNotification;
  };

  public type Notification = {
    id : NotificationId;
    userId : Principal;
    title : Text;
    message : Text;
    kind : NotificationKind;
    isRead : Bool;
    createdAt : Int;
  };
};
