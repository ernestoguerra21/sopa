import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TimeEntriesService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string, employeeId: string, from?: string, to?: string) {
    return this.db.timeEntry.findMany({
      where: {
        tenantId,
        employeeId,
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      orderBy: { date: "desc" },
    });
  }

  create(tenantId: string, data: { employeeId: string; date: string; hours?: number }) {
    return this.db.timeEntry.create({
      data: { tenantId, employeeId: data.employeeId, date: new Date(data.date), hours: data.hours },
    });
  }

  remove(id: string, tenantId: string) {
    return this.db.timeEntry.deleteMany({ where: { id, tenantId } });
  }
}
