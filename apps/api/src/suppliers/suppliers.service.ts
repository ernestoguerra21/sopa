import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SuppliersService {
  constructor(private readonly db: PrismaService) {}

  findAll(businessId: string) {
    return this.db.supplier.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
  }

  create(tenantId: string, businessId: string, data: { name: string; contact?: string; phone?: string }) {
    return this.db.supplier.create({ data: { tenantId, businessId, ...data } });
  }

  update(id: string, businessId: string, data: { name?: string; contact?: string; phone?: string }) {
    return this.db.supplier.updateMany({ where: { id, businessId }, data });
  }

  remove(id: string, businessId: string) {
    return this.db.supplier.deleteMany({ where: { id, businessId } });
  }
}
