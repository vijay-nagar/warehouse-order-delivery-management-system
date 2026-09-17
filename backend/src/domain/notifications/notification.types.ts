export type NotificationType =
  | "INFO"
  | "ORDER"
  | "INVENTORY"
  | "DELIVERY"
  | "SYSTEM";

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
}
