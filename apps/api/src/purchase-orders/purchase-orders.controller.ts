import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseOrdersController {
  constructor(private readonly orders: PurchaseOrdersService) {}

  @Get()
  @RequirePermissions("purchase_orders.manage")
  findAll(@Request() req) {
    return this.orders.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermissions("purchase_orders.manage")
  create(@Request() req, @Body() body: any) {
    return this.orders.create(req.user.tenantId, body);
  }

  @Patch(":id/receive")
  @RequirePermissions("purchase_orders.manage")
  markReceived(@Param("id") id: string, @Request() req) {
    return this.orders.markReceived(id, req.user.tenantId);
  }

  @Patch(":id/cancel")
  @RequirePermissions("purchase_orders.manage")
  cancel(@Param("id") id: string, @Request() req) {
    return this.orders.cancel(id, req.user.tenantId);
  }

  @Delete(":id")
  @RequirePermissions("purchase_orders.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.orders.remove(id, req.user.tenantId);
  }
}
