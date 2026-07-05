import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SuppliersService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.supplier.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  create(tenantId: string, data: { name: string; contact?: string; phone?: string }) {
    return this.db.supplier.create({ data: { tenantId, ...data } });
  }

  update(id: string, tenantId: string, data: { name?: string; contact?: string; phone?: string }) {
    return this.db.supplier.updateMany({ where: { id, tenantId }, data });
  }

  remove(id: string, tenantId: string) {
    return this.db.supplier.deleteMany({ where: { id, tenantId } });
  }
}
