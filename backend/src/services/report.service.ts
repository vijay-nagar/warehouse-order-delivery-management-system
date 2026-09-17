import { ReportRepository } from "../repositories/report.repository.js";
import type { OrderSummaryReport } from "../domain/reports/report.types.js";

export class ReportService {
  private readonly reportRepository = new ReportRepository();

  async getOrderSummary(
    fromDate?: string,
    toDate?: string,
  ): Promise<OrderSummaryReport> {
    if (fromDate && toDate && fromDate > toDate) {
      throw new Error("fromDate cannot be greater than toDate");
    }

    return this.reportRepository.getOrderSummary(fromDate, toDate);
  }
}
