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

  findAll(businessId: string) {
    return this.db.purchaseOrder.findMany({
      where: { businessId },
      include: { supplier: true, items: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
  }

  create(tenantId: string, businessId: string, data: CreateOrderDto) {
    return this.db.purchaseOrder.create({
      data: {
        tenantId,
        businessId,
        supplierId: data.supplierId,
        notes: data.notes,
        items: { create: data.items },
      },
      include: { supplier: true, items: true },
    });
  }

  async markReceived(id: string, businessId: string) {
    const order = await this.db.purchaseOrder.findFirst({
      where: { id, businessId },
      include: { items: true, supplier: true },
    });
    if (!order || order.status !== "PENDING") return { count: 0 };

    return this.db.$transaction([
      ...order.items
        .filter(i => i.inventoryItemId)
        .flatMap(i => [
          this.db.inventoryItem.update({
            where: { id: i.inventoryItemId! },
            data: { quantity: { increment: i.quantity } },
          }),
          this.db.stockMovement.create({
            data: {
              inventoryItemId: i.inventoryItemId!,
              tenantId: order.tenantId,
              businessId,
              type: "COMPRA",
              delta: i.quantity,
              note: `Orden de ${order.supplier?.name ?? "proveedor"}`,
            },
          }),
        ]),
      this.db.purchaseOrder.update({ where: { id }, data: { status: "RECEIVED" } }),
    ]);
  }

  cancel(id: string, businessId: string) {
    return this.db.purchaseOrder.updateMany({
      where: { id, businessId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  remove(id: string, businessId: string) {
    return this.db.purchaseOrder.deleteMany({ where: { id, businessId } });
  }
}
