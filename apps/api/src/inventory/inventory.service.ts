import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export type MovementType = "ENTRADA" | "SALIDA" | "MERMA" | "AJUSTE" | "COMPRA";

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

  /** Todo cambio de stock pasa por aquí: actualiza cantidad, deja rastro y dispara alerta de mínimo. */
  async registerMovement(
    itemId: string,
    tenantId: string,
    businessId: string,
    delta: number,
    type: MovementType,
    note?: string,
  ) {
    return this.db.$transaction(async tx => {
      const item = await tx.inventoryItem.findFirst({ where: { id: itemId, businessId } });
      if (!item) throw new NotFoundException("Artículo no encontrado");

      const newQty = Math.round((item.quantity + delta) * 100) / 100;
      if (newQty < 0) throw new BadRequestException(`Stock insuficiente: quedan ${item.quantity} ${item.unit}`);

      const updated = await tx.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: newQty },
      });
      await tx.stockMovement.create({
        data: { inventoryItemId: itemId, tenantId, businessId, type, delta, note },
      });

      // Alerta al cruzar el mínimo (solo si hay mínimo definido y no existe ya una activa para este artículo)
      if (item.minQuantity > 0 && newQty <= item.minQuantity && item.quantity > item.minQuantity) {
        // ponytail: dedupe por nombre dentro del mensaje; si Alert gana un campo itemId, usar eso
        const existing = await tx.alert.findFirst({
          where: { businessId, type: "LOW_STOCK", dismissed: false, message: { contains: item.name } },
        });
        if (!existing) {
          await tx.alert.create({
            data: {
              type: "LOW_STOCK",
              message: `${item.name} por debajo del mínimo (${newQty} ${item.unit}, mínimo ${item.minQuantity})`,
              tenantId,
              businessId,
            },
          });
        }
      }
      return updated;
    });
  }

  listMovements(itemId: string, businessId: string) {
    return this.db.stockMovement.findMany({
      where: { inventoryItemId: itemId, businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  /** name/unit/minQuantity se editan directo; quantity pasa por un movimiento AJUSTE para no perder rastro. */
  async update(
    id: string,
    tenantId: string,
    businessId: string,
    data: { name?: string; unit?: string; quantity?: number; minQuantity?: number },
  ) {
    const { quantity, ...rest } = data;
    if (Object.keys(rest).length > 0) {
      await this.db.inventoryItem.updateMany({ where: { id, businessId }, data: rest });
    }
    if (quantity !== undefined) {
      const item = await this.db.inventoryItem.findFirst({ where: { id, businessId } });
      if (!item) throw new NotFoundException("Artículo no encontrado");
      const delta = Math.round((quantity - item.quantity) * 100) / 100;
      if (delta !== 0) return this.registerMovement(id, tenantId, businessId, delta, "AJUSTE", "Ajuste manual");
    }
    return this.db.inventoryItem.findFirst({ where: { id, businessId } });
  }

  remove(id: string, businessId: string) {
    return this.db.inventoryItem.deleteMany({ where: { id, businessId } });
  }
}
