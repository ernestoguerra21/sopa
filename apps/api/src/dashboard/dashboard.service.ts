import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly db: PrismaService) {}

  async getSummary(businessId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [salesEntries, activeEmployees, pendingTasks, pendingOrders] =
      await Promise.all([
        this.db.salesEntry.findMany({
          where: { businessId, date: { gte: todayStart } },
          orderBy: { date: "desc" },
          take: 1,
        }),
        this.db.employee.count({ where: { businessId, status: "ACTIVE" } }),
        this.db.task.count({
          where: { businessId, status: { in: ["PENDING", "IN_PROGRESS"] } },
        }),
        this.db.purchaseOrder.count({ where: { businessId, status: "PENDING" } }),
      ]);

    const today = salesEntries[0] ?? null;
    // Decimal → number para la respuesta JSON; céntimos exactos redondeando a 2
    const sales = today ? Number(today.sales) : 0;
    const expenses = today ? Number(today.expenses) : 0;

    return {
      sales,
      expenses,
      profit: Math.round((sales - expenses) * 100) / 100,
      activeEmployees,
      pendingTasks,
      pendingOrders,
      hasEntry: !!today,
    };
  }

  async getAlerts(businessId: string) {
    return this.db.alert.findMany({
      where: { businessId, dismissed: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async dismissAlert(alertId: string, businessId: string) {
    return this.db.alert.updateMany({
      where: { id: alertId, businessId },
      data: { dismissed: true },
    });
  }

  async createSalesEntry(
    tenantId: string,
    businessId: string,
    data: { sales: number; expenses: number; notes?: string },
  ) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return this.db.salesEntry.upsert({
      where: {
        // use a composite workaround: delete old + create new if exists
        id: (
          await this.db.salesEntry.findFirst({
            where: { businessId, date: { gte: todayStart } },
          })
        )?.id ?? "new",
      },
      update: { sales: data.sales, expenses: data.expenses, notes: data.notes },
      create: { tenantId, businessId, sales: data.sales, expenses: data.expenses, notes: data.notes },
    });
  }
}
