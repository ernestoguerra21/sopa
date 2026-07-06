import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateTimeOffInput {
  employeeId: string;
  type: "VACATION" | "SICK_LEAVE" | "PERSONAL" | "UNPAID";
  startDate: string;
  endDate: string;
  reason?: string;
}

@Injectable()
export class TimeOffService {
  constructor(private prisma: PrismaService) {}

  async create(
    tenantId: string,
    businessId: string,
    data: CreateTimeOffInput
  ): Promise<any> {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      throw new BadRequestException("startDate must be before endDate");
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee || employee.tenantId !== tenantId || employee.businessId !== businessId) {
      throw new NotFoundException("Employee not found or not in this business");
    }

    return this.prisma.timeOff.create({
      data: {
        employeeId: data.employeeId,
        tenantId,
        businessId,
        type: data.type,
        startDate: start,
        endDate: end,
        reason: data.reason,
      },
      include: { employee: true },
    });
  }

  async listByEmployee(
    tenantId: string,
    businessId: string,
    employeeId: string,
    status?: string
  ): Promise<any[]> {
    const where: any = {
      tenantId,
      businessId,
      employeeId,
    };
    if (status) where.status = status;

    return this.prisma.timeOff.findMany({
      where,
      include: { employee: true },
      orderBy: { startDate: "asc" },
    });
  }

  async listByBusiness(
    tenantId: string,
    businessId: string,
    status?: string
  ): Promise<any[]> {
    const where: any = { tenantId, businessId };
    if (status) where.status = status;

    return this.prisma.timeOff.findMany({
      where,
      include: { employee: true },
      orderBy: { startDate: "asc" },
    });
  }

  async approve(
    tenantId: string,
    businessId: string,
    id: string,
    approvedByUserId: string
  ): Promise<any> {
    const timeOff = await this.prisma.timeOff.findUnique({ where: { id } });
    if (!timeOff || timeOff.tenantId !== tenantId || timeOff.businessId !== businessId) {
      throw new NotFoundException("TimeOff request not found");
    }

    return this.prisma.timeOff.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy: approvedByUserId,
        approvedAt: new Date(),
      },
      include: { employee: true },
    });
  }

  async reject(
    tenantId: string,
    businessId: string,
    id: string
  ): Promise<any> {
    const timeOff = await this.prisma.timeOff.findUnique({ where: { id } });
    if (!timeOff || timeOff.tenantId !== tenantId || timeOff.businessId !== businessId) {
      throw new NotFoundException("TimeOff request not found");
    }

    return this.prisma.timeOff.update({
      where: { id },
      data: { status: "REJECTED" },
      include: { employee: true },
    });
  }

  async delete(tenantId: string, businessId: string, id: string): Promise<void> {
    const timeOff = await this.prisma.timeOff.findUnique({ where: { id } });
    if (!timeOff || timeOff.tenantId !== tenantId || timeOff.businessId !== businessId) {
      throw new NotFoundException("TimeOff request not found");
    }

    await this.prisma.timeOff.delete({ where: { id } });
  }

  async getCalendar(
    tenantId: string,
    businessId: string,
    month: number,
    year: number
  ): Promise<{ date: string; employees: { id: string; name: string }[] }[]> {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const approvedTimeOffs = await this.prisma.timeOff.findMany({
      where: {
        tenantId,
        businessId,
        status: "APPROVED",
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { employee: true },
    });

    const calendar: Map<string, Set<string>> = new Map();

    approvedTimeOffs.forEach((timeOff) => {
      let current = new Date(timeOff.startDate);
      while (current <= timeOff.endDate) {
        const dateStr = current.toISOString().split("T")[0];
        if (!calendar.has(dateStr)) {
          calendar.set(dateStr, new Set());
        }
        calendar.get(dateStr)!.add(JSON.stringify({ id: timeOff.employee.id, name: timeOff.employee.name }));
        current.setDate(current.getDate() + 1);
      }
    });

    const result: { date: string; employees: { id: string; name: string }[] }[] = [];
    for (const [date, employeeSet] of calendar.entries()) {
      result.push({
        date,
        employees: Array.from(employeeSet).map((json) => JSON.parse(json)),
      });
    }

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
}
