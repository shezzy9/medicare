import List "mo:core/List";
import NotificationsLib "../lib/notifications";
import Types "../types/notifications";

mixin (
  notifications : List.List<Types.Notification>,
  nextId : { var nextNotificationId : Nat },
) {
  // Creates a notification for the given user. This is the internal helper
  // used by other domains to notify patients/doctors of events. Returns the
  // created notification.
  public shared func createNotification(
    userId : Principal,
    title : Text,
    message : Text,
    kind : Types.NotificationKind,
  ) : async Types.Notification {
    notifications.createNotification(nextId, userId, title, message, kind)
  };

  // Returns the caller's notifications, newest first. A user can only ever
  // see their own notifications.
  public query ({ caller }) func listMyNotifications() : async [Types.Notification] {
    notifications.listForUser(caller)
  };

  // Marks one of the caller's notifications as read. Returns true if the
  // notification existed and belonged to the caller.
  public shared ({ caller }) func markNotificationAsRead(notificationId : Types.NotificationId) : async Bool {
    notifications.markAsRead(caller, notificationId)
  };

  // Marks all of the caller's notifications as read.
  public shared ({ caller }) func markAllNotificationsRead() : async () {
    notifications.markAllRead(caller)
  };

  // Returns the caller's unread notification count.
  public query ({ caller }) func unreadNotificationCount() : async Nat {
    notifications.unreadCount(caller)
  };
};
