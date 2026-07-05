import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly orders: PurchaseOrdersService) {}

  @Get()
  findAll(@Request() req) {
    return this.orders.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.orders.create(req.user.tenantId, body);
  }

  @Patch(":id/receive")
  markReceived(@Param("id") id: string, @Request() req) {
    return this.orders.markReceived(id, req.user.tenantId);
  }

  @Patch(":id/cancel")
  cancel(@Param("id") id: string, @Request() req) {
    return this.orders.cancel(id, req.user.tenantId);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.orders.remove(id, req.user.tenantId);
  }
}
