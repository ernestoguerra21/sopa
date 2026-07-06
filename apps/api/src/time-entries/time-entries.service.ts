import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TimeEntriesService {
  constructor(private readonly db: PrismaService) {}

  findAll(businessId: string, employeeId: string, from?: string, to?: string) {
    return this.db.timeEntry.findMany({
      where: {
        businessId,
        employeeId,
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      orderBy: { date: "desc" },
    });
  }

  create(tenantId: string, businessId: string, data: { employeeId: string; date: string; hours?: number }) {
    return this.db.timeEntry.create({
      data: { tenantId, businessId, employeeId: data.employeeId, date: new Date(data.date), hours: data.hours },
    });
  }

  update(id: string, businessId: string, data: { date?: string; hours?: number }) {
    return this.db.timeEntry.updateMany({
      where: { id, businessId },
      data: { ...(data.date ? { date: new Date(data.date) } : {}), ...(data.hours !== undefined ? { hours: data.hours } : {}) },
    });
  }

  remove(id: string, businessId: string) {
    return this.db.timeEntry.deleteMany({ where: { id, businessId } });
  }
}
