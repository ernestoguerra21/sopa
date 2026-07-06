import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DepartmentsService {
  constructor(private readonly db: PrismaService) {}

  findAll(businessId: string) {
    return this.db.department.findMany({
      where: { businessId },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: "asc" },
    });
  }

  create(tenantId: string, businessId: string, data: { name: string; parentId?: string }) {
    return this.db.department.create({ data: { tenantId, businessId, ...data } });
  }

  update(id: string, businessId: string, data: { name?: string; parentId?: string | null }) {
    return this.db.department.updateMany({ where: { id, businessId }, data });
  }

  remove(id: string, businessId: string) {
    return this.db.department.deleteMany({ where: { id, businessId } });
  }
}
