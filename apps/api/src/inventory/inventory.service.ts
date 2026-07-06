import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly db: PrismaService) {}

  findAll(businessId: string) {
    return this.db.inventoryItem.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });
  }

  create(tenantId: string, businessId: string, data: { name: string; unit: string; quantity?: number; minQuantity?: number }) {
    return this.db.inventoryItem.create({
      data: {
        tenantId,
        businessId,
        name: data.name,
        unit: data.unit,
        quantity: data.quantity ?? 0,
        minQuantity: data.minQuantity ?? 0,
      },
    });
  }

  update(id: string, businessId: string, data: { name?: string; unit?: string; quantity?: number; minQuantity?: number }) {
    return this.db.inventoryItem.updateMany({ where: { id, businessId }, data });
  }

  remove(id: string, businessId: string) {
    return this.db.inventoryItem.deleteMany({ where: { id, businessId } });
  }
}
