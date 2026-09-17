import type { Response } from "express";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { orderSummaryQuerySchema } from "../validators/report.validator.js";
import { ReportService } from "../services/report.service.js";

const reportService = new ReportService();

export const getOrderSummary = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const query = orderSummaryQuerySchema.parse(req.query);

  const report = await reportService.getOrderSummary(
    query.fromDate,
    query.toDate,
  );

  res.status(200).json({
    success: true,
    data: report,
  });
};
