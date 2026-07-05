import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly db: PrismaService) {}

  async getSummary(tenantId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [salesEntries, activeEmployees, pendingTasks, pendingOrders] =
      await Promise.all([
        this.db.salesEntry.findMany({
          where: { tenantId, date: { gte: todayStart } },
          orderBy: { date: "desc" },
          take: 1,
        }),
        this.db.employee.count({ where: { tenantId, status: "ACTIVE" } }),
        this.db.task.count({
          where: { tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        }),
        this.db.purchaseOrder.count({ where: { tenantId, status: "PENDING" } }),
      ]);

    const today = salesEntries[0] ?? null;
    const sales = today?.sales ?? 0;
    const expenses = today?.expenses ?? 0;

    return {
      sales,
      expenses,
      profit: sales - expenses,
      activeEmployees,
      pendingTasks,
      pendingOrders,
      hasEntry: !!today,
    };
  }

  async getAlerts(tenantId: string) {
    return this.db.alert.findMany({
      where: { tenantId, dismissed: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async dismissAlert(alertId: string, tenantId: string) {
    return this.db.alert.updateMany({
      where: { id: alertId, tenantId },
      data: { dismissed: true },
    });
  }

  async createSalesEntry(
    tenantId: string,
    data: { sales: number; expenses: number; notes?: string },
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.db.salesEntry.upsert({
      where: {
        // use a composite workaround: delete old + create new if exists
        id: (
          await this.db.salesEntry.findFirst({
            where: { tenantId, date: { gte: todayStart } },
          })
        )?.id ?? "new",
      },
      update: { sales: data.sales, expenses: data.expenses, notes: data.notes },
      create: { tenantId, sales: data.sales, expenses: data.expenses, notes: data.notes },
    });
  }
}
