import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { EmployeesModule } from "./employees/employees.module";
import { InventoryModule } from "./inventory/inventory.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PurchaseOrdersModule } from "./purchase-orders/purchase-orders.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { TasksModule } from "./tasks/tasks.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    TasksModule,
    EmployeesModule,
    InventoryModule,
    SuppliersModule,
    PurchaseOrdersModule,
  ],
})
export class AppModule {}
