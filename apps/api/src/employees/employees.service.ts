import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface EmployeeInput {
  name?: string;
  position?: string;
  status?: "ACTIVE" | "INACTIVE";
  lastName?: string;
  documentId?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  departmentId?: string | null;
  managerId?: string | null;
  contractType?: "FIJO" | "TEMPORAL";
  payRateType?: "POR_HORA" | "POR_DIA" | "MENSUAL_FIJO";
  payRate?: number;
  scheduleType?: "FIJO" | "ROTATIVO" | "ABIERTO";
  scheduleDetail?: Record<string, unknown> | null;
}

function toPrismaData(data: EmployeeInput) {
  return {
    ...data,
    birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
  };
}

@Injectable()
export class EmployeesService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.employee.findMany({
      where: { tenantId },
      include: {
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
  }

  create(tenantId: string, data: { name: string; position: string } & EmployeeInput) {
    return this.db.employee.create({
      data: { tenantId, ...toPrismaData(data) } as any,
    });
  }

  update(id: string, tenantId: string, data: EmployeeInput) {
    return this.db.employee.updateMany({ where: { id, tenantId }, data: toPrismaData(data) as any });
  }

  remove(id: string, tenantId: string) {
    return this.db.employee.deleteMany({ where: { id, tenantId } });
  }
}
