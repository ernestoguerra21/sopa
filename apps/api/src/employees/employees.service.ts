import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EmployeesService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.employee.findMany({
      where: { tenantId },
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
  }

  create(tenantId: string, data: { name: string; position: string }) {
    return this.db.employee.create({
      data: { tenantId, name: data.name, position: data.position },
    });
  }

  update(id: string, tenantId: string, data: { name?: string; position?: string; status?: "ACTIVE" | "INACTIVE" }) {
    return this.db.employee.updateMany({ where: { id, tenantId }, data });
  }

  remove(id: string, tenantId: string) {
    return this.db.employee.deleteMany({ where: { id, tenantId } });
  }
}
