import Int "mo:core/Int";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/notifications";

module {
  // Creates a notification for the given user and appends it to the store.
  // Returns the created notification. Used by other domains to notify
  // patients/doctors of events (appointments, consultations, prescriptions,
  // vitals, medical history, device status, system messages).
  public func createNotification(
    self : List.List<Types.Notification>,
    nextId : { var nextNotificationId : Nat },
    userId : Principal,
    title : Text,
    message : Text,
    kind : Types.NotificationKind,
  ) : Types.Notification {
    let notification : Types.Notification = {
      id = nextId.nextNotificationId;
      userId;
      title;
      message;
      kind;
      isRead = false;
      createdAt = Time.now();
    };
    nextId.nextNotificationId += 1;
    self.add(notification);
    notification
  };

  // Returns all notifications belonging to the given user, newest first.
  public func listForUser(self : List.List<Types.Notification>, userId : Principal) : [Types.Notification] {
    let mine = self.toArray().filter(func n = n.userId == userId);
    mine.sort(func (a, b) = Int.compare(b.createdAt, a.createdAt))
  };

  // Marks a single notification as read, but only if it belongs to the given
  // user. Returns true if the notification was found and updated.
  public func markAsRead(self : List.List<Types.Notification>, userId : Principal, notificationId : Types.NotificationId) : Bool {
    var found = false;
    let snapshot = self.toArray();
    self.clear();
    for (n in snapshot.values()) {
      if (n.id == notificationId and n.userId == userId) {
        self.add({ n with isRead = true });
        found := true;
      } else {
        self.add(n);
      };
    };
    found
  };

  // Marks every notification belonging to the given user as read.
  public func markAllRead(self : List.List<Types.Notification>, userId : Principal) : () {
    let snapshot = self.toArray();
    self.clear();
    for (n in snapshot.values()) {
      if (n.userId == userId) {
        self.add({ n with isRead = true });
      } else {
        self.add(n);
      };
    };
  };

  // Counts the unread notifications belonging to the given user.
  public func unreadCount(self : List.List<Types.Notification>, userId : Principal) : Nat {
    self.toArray().filter(func n = n.userId == userId and not n.isRead).size()
  };
};
