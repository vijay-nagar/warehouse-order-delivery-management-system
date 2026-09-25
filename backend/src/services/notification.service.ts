import { NotificationRepository } from "../repositories/notification.repository.js";
import type {
  CreateNotificationInput,
  Notification,
} from "../domain/notifications/notification.types.js";
import type {
  PaginationRequest,
  PaginationResult,
} from "../shared/pagination/pagination.types.js";

export class NotificationService {
  private readonly notificationRepository =
    new NotificationRepository();

  async create(
    input: CreateNotificationInput,
  ): Promise<Notification> {
    return this.notificationRepository.create(input);
  }

  async getUserNotifications(
    userId: number,
    pagination: PaginationRequest,
  ): Promise<PaginationResult<Notification>> {
    return this.notificationRepository.findByUserId(userId, pagination);
  }

  async getUnreadNotifications(
    userId: number,
    pagination: PaginationRequest,
  ): Promise<PaginationResult<Notification>> {
    return this.notificationRepository.findUnreadByUserId(userId, pagination);
  }

  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<Notification> {
    const notification =
      await this.notificationRepository.markAsRead(
        notificationId,
        userId,
      );

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }
}
