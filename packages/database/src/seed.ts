import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  const tenant = await db.tenant.upsert({
    where: { slug: "demo-restaurante" },
    update: {},
    create: { name: "Restaurante Demo", slug: "demo-restaurante" },
  });

  await db.user.upsert({
    where: { email: "gerente@demo.com" },
    update: {},
    create: {
      email: "gerente@demo.com",
      password: hashPassword("demo1234"),
      name: "Ana García",
      role: "MANAGER",
      tenantId: tenant.id,
    },
  });

  await db.user.upsert({
    where: { email: "dueno@demo.com" },
    update: {},
    create: {
      email: "dueno@demo.com",
      password: hashPassword("demo1234"),
      name: "Carlos López",
      role: "OWNER",
      tenantId: tenant.id,
    },
  });

  const existingEmployees = await db.employee.count({ where: { tenantId: tenant.id } });
  if (existingEmployees === 0) await db.employee.createMany({
    data: [
      { name: "María Torres", position: "Camarera", status: "ACTIVE", tenantId: tenant.id },
      { name: "Pedro Ruiz", position: "Cocinero", status: "ACTIVE", tenantId: tenant.id },
      { name: "Lucía Martín", position: "Barra", status: "ACTIVE", tenantId: tenant.id },
      { name: "Javier Sanz", position: "Ayudante cocina", status: "INACTIVE", tenantId: tenant.id },
    ],
  });

  const manager = await db.user.findUnique({ where: { email: "gerente@demo.com" } });

  const existingTasks = await db.task.count({ where: { tenantId: tenant.id } });
  if (existingTasks === 0) await db.task.createMany({
    data: [
      {
        title: "Inventario semanal",
        description: "Revisar stock de cámara y despensa",
        priority: "HIGH",
        status: "PENDING",
        tenantId: tenant.id,
        assigneeId: manager!.id,
        dueDate: new Date(),
      },
      {
        title: "Limpieza de cámaras frigoríficas",
        priority: "MEDIUM",
        status: "PENDING",
        tenantId: tenant.id,
        assigneeId: manager!.id,
        dueDate: new Date(),
      },
      {
        title: "Revisar caja del turno de noche",
        priority: "HIGH",
        status: "DONE",
        tenantId: tenant.id,
        assigneeId: manager!.id,
      },
      {
        title: "Cambiar aceite freidoras",
        priority: "LOW",
        status: "PENDING",
        tenantId: tenant.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await db.salesEntry.findFirst({
    where: { tenantId: tenant.id, date: { gte: today } },
  });
  if (!existing) {
    await db.salesEntry.create({
      data: { sales: 1850.0, expenses: 620.0, tenantId: tenant.id, notes: "Turno completo" },
    });
  }

  const existingAlerts = await db.alert.count({ where: { tenantId: tenant.id } });
  if (existingAlerts === 0) await db.alert.createMany({
    data: [
      {
        type: "OVERDUE_TASK",
        message: "2 tareas con fecha límite vencida",
        tenantId: tenant.id,
      },
      {
        type: "LOW_STOCK",
        message: "Aceite de oliva por debajo del mínimo",
        tenantId: tenant.id,
      },
    ],
  });

  const existingItems = await db.inventoryItem.count({ where: { tenantId: tenant.id } });
  if (existingItems === 0) await db.inventoryItem.createMany({
    data: [
      { name: "Aceite de oliva", unit: "L",   quantity: 4,  minQuantity: 10, tenantId: tenant.id },
      { name: "Harina",          unit: "kg",  quantity: 25, minQuantity: 15, tenantId: tenant.id },
      { name: "Tomate triturado",unit: "kg",  quantity: 8,  minQuantity: 12, tenantId: tenant.id },
      { name: "Vino de la casa", unit: "uds", quantity: 36, minQuantity: 24, tenantId: tenant.id },
      { name: "Servilletas",     unit: "uds", quantity: 400,minQuantity: 200,tenantId: tenant.id },
      { name: "Queso mozzarella",unit: "kg",  quantity: 6,  minQuantity: 8,  tenantId: tenant.id },
    ],
  });

  const existingSuppliers = await db.supplier.count({ where: { tenantId: tenant.id } });
  if (existingSuppliers === 0) {
    await db.supplier.createMany({
      data: [
        { name: "Distribuciones Ibérica", contact: "Manolo Pérez", phone: "600111222", tenantId: tenant.id },
        { name: "Frescos del Mercado",     contact: "Rosa Díaz",   phone: "600333444", tenantId: tenant.id },
        { name: "Bodegas del Sur",         contact: "Iván Cortés", phone: "600555666", tenantId: tenant.id },
      ],
    });

    const iberica = await db.supplier.findFirst({ where: { tenantId: tenant.id, name: "Distribuciones Ibérica" } });
    const aceite = await db.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: "Aceite de oliva" } });
    const tomate = await db.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: "Tomate triturado" } });

    await db.purchaseOrder.create({
      data: {
        tenantId: tenant.id,
        supplierId: iberica!.id,
        status: "PENDING",
        items: {
          create: [
            { name: "Aceite de oliva", quantity: 20, unit: "L",  inventoryItemId: aceite?.id },
            { name: "Tomate triturado", quantity: 15, unit: "kg", inventoryItemId: tomate?.id },
          ],
        },
      },
    });
  }

  console.log("Seed completado — tenant:", tenant.slug);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
