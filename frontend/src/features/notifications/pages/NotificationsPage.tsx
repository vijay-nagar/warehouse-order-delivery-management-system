import { useEffect, useState } from "react";
import { api } from "../../../services/api";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/notifications/me");
      setNotifications(response.data.data ?? []);
    } catch {
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch {
      setError("Unable to mark notification as read.");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="module-page">
      <div className="module-page-header">
        <div>
          <h1>Notifications</h1>
          <p>View and manage your system notifications.</p>
        </div>

        <button
          className="module-refresh-button"
          onClick={loadNotifications}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && <div className="module-alert">{error}</div>}

      <div className="module-panel">
        {loading ? (
          <div className="module-alert">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="module-alert">No notifications found.</div>
        ) : (
          <div className="module-table-wrapper">
            <table className="module-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {notifications.map((notification) => (
                  <tr
                    key={notification.id}
                    style={{
                      fontWeight: notification.isRead ? 400 : 600,
                    }}
                  >
                    <td>
                      <span className="module-status">
                        {notification.type}
                      </span>
                    </td>

                    <td>{notification.title}</td>

                    <td>{notification.message}</td>

                    <td>
                      <span className="module-status">
                        {notification.isRead ? "READ" : "UNREAD"}
                      </span>
                    </td>

                    <td>
                      {new Date(notification.createdAt).toLocaleString(
                        "en-IN",
                      )}
                    </td>

                    <td>
                      {!notification.isRead ? (
                        <button
                          className="module-refresh-button"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </button>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
