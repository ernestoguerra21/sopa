import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DepartmentsService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.department.findMany({
      where: { tenantId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });
  }

  create(tenantId: string, data: { name: string; parentId?: string }) {
    return this.db.department.create({ data: { tenantId, ...data } });
  }

  update(id: string, tenantId: string, data: { name?: string; parentId?: string | null }) {
    return this.db.department.updateMany({ where: { id, tenantId }, data });
  }

  remove(id: string, tenantId: string) {
    return this.db.department.deleteMany({ where: { id, tenantId } });
  }
}
