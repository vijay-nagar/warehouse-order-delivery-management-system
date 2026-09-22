import { Router } from "express";
import { InventoryReservationService } from "../services/inventory-reservation.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/permission.middleware.js";

const router = Router();
const reservationService = new InventoryReservationService();

router.use(authenticate);
router.use(requirePermission("INVENTORY_UPDATE"));

router.post("/:orderId", async (req, res, next): Promise<void> => {
  try {
    const orderId = Number(req.params.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid orderId.",
      });
      return;
    }

    const reservations =
      await reservationService.reserveOrder(orderId);

    res.status(200).json({
      success: true,
      message: "Stock reserved successfully.",
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
