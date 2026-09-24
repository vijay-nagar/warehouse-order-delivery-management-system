export interface NotificationInput {
  recipientId: number;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
}

export class NotificationService {
  async send(notification: NotificationInput): Promise<void> {
    console.log("[NOTIFICATION] Sending notification:", {
      recipientId: notification.recipientId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      metadata: notification.metadata,
    });

    // Future:
    // In-app notification
    // Email
    // SMS
    // Push notification
  }
}

export const notificationService = new NotificationService();