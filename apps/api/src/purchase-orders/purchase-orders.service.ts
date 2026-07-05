import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

interface CreateOrderDto {
  supplierId: string;
  notes?: string;
  items: { name: string; quantity: number; unit: string; inventoryItemId?: string }[];
}

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly db: PrismaService) {}

  findAll(tenantId: string) {
    return this.db.purchaseOrder.findMany({
      where: { tenantId },
      include: { supplier: true, items: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  create(tenantId: string, data: CreateOrderDto) {
    return this.db.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        notes: data.notes,
        items: { create: data.items },
      },
      include: { supplier: true, items: true },
    });
  }

  async markReceived(id: string, tenantId: string) {
    const order = await this.db.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING") return { count: 0 };

    return this.db.$transaction([
      ...order.items
        .filter(i => i.inventoryItemId)
        .map(i =>
          this.db.inventoryItem.update({
            where: { id: i.inventoryItemId! },
            data: { quantity: { increment: i.quantity } },
          }),
        ),
      this.db.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED" } }),
    ]);
  }

  cancel(id: string, tenantId: string) {
    return this.db.purchaseOrder.updateMany({
      where: { id, tenantId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  remove(id: string, tenantId: string) {
    return this.db.purchaseOrder.deleteMany({ where: { id, tenantId } });
  }
}
