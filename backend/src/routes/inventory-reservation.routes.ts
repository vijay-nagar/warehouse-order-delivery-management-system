import { Router } from "express";
import { InventoryReservationService } from "../services/inventory-reservation.service.js";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";
import { rabbitMQService } from "../infrastructure/rabbitmq/rabbitmq.service.js";

const router = Router();
const reservationService = new InventoryReservationService();

router.use(authenticate);
router.use(requirePermission("INVENTORY_UPDATE"));

router.post("/:orderId", async (req: AuthenticatedRequest, res, next): Promise<void> => {
  try {
    const orderId = Number(req.params.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid orderId.",
      });
      return;
    }

    const result = await reservationService.reserveOrder(
      orderId,
      req.user?.userId ?? null,
    );

    if (result.warehouseId && result.reservations.length > 0) {
      const eventPayload = {
        orderId,
        warehouseId: result.warehouseId,
      };

      rabbitMQService
        .publish("STOCK_RESERVED", { event: "STOCK_RESERVED", ...eventPayload })
        .catch((error) => console.error("[INVENTORY_RESERVATION] Failed to publish STOCK_RESERVED:", error));

      rabbitMQService
        .publish("PICK_TASK_CREATED", { event: "PICK_TASK_CREATED", ...eventPayload })
        .catch((error) => console.error("[INVENTORY_RESERVATION] Failed to publish PICK_TASK_CREATED:", error));

      res.status(200).json({
        success: true,
        message: "Stock reserved successfully.",
        data: result.reservations,
      });
      return;
    }

    rabbitMQService
      .publish("OUT_OF_STOCK", {
        event: "OUT_OF_STOCK",
        orderId,
        shortfalls: result.shortfalls,
      })
      .catch((error) => console.error("[INVENTORY_RESERVATION] Failed to publish OUT_OF_STOCK:", error));

    res.status(200).json({
      success: true,
      message: "No warehouse currently has sufficient stock for this order; order moved to OUT_OF_STOCK.",
      data: { shortfalls: result.shortfalls },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
