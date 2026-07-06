import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DepartmentsModule } from "./departments/departments.module";
import { EmployeesModule } from "./employees/employees.module";
import { InventoryModule } from "./inventory/inventory.module";
import { MembersModule } from "./members/members.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PurchaseOrdersModule } from "./purchase-orders/purchase-orders.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { TasksModule } from "./tasks/tasks.module";
import { TimeEntriesModule } from "./time-entries/time-entries.module";

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
    DepartmentsModule,
    TimeEntriesModule,
    MembersModule,
    BusinessesModule,
  ],
})
export class AppModule {}
