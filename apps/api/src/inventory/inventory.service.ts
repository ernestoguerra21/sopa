import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class InventoryService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  create(tenantId: string, data: { name: string; unit: string; quantity?: number; minQuantity?: number }) {
    return this.db.inventoryItem.create({
      data: {
        tenantId,
        name: data.name,
        unit: data.unit,
        quantity: data.quantity ?? 0,
        minQuantity: data.minQuantity ?? 0,
      },
    });
  }

  update(id: string, tenantId: string, data: { name?: string; unit?: string; quantity?: number; minQuantity?: number }) {
    return this.db.inventoryItem.updateMany({ where: { id, tenantId }, data });
  }

  remove(id: string, tenantId: string) {
    return this.db.inventoryItem.deleteMany({ where: { id, tenantId } });
  }
}
