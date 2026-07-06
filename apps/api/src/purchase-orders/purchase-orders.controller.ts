import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class PurchaseOrdersController {
  constructor(private readonly orders: PurchaseOrdersService) {}

  @Get()
  @RequirePermissions("purchase_orders.manage")
  findAll(@Request() req) {
    return this.orders.findAll(req.businessId);
  }

  @Post()
  @RequirePermissions("purchase_orders.manage")
  create(@Request() req, @Body() body: any) {
    return this.orders.create(req.user.tenantId, req.businessId, body);
  }

  @Patch(":id/receive")
  @RequirePermissions("purchase_orders.manage")
  markReceived(@Param("id") id: string, @Request() req) {
    return this.orders.markReceived(id, req.businessId);
  }

  @Patch(":id/cancel")
  @RequirePermissions("purchase_orders.manage")
  cancel(@Param("id") id: string, @Request() req) {
    return this.orders.cancel(id, req.businessId);
  }

  @Delete(":id")
  @RequirePermissions("purchase_orders.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.orders.remove(id, req.businessId);
  }
}
