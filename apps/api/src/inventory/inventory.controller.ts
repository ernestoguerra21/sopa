import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @RequirePermissions("inventory.view")
  findAll(@Request() req) {
    return this.inventory.findAll(req.businessId);
  }

  @Post()
  @RequirePermissions("inventory.manage")
  create(@Request() req, @Body() body: any) {
    return this.inventory.create(req.user.tenantId, req.businessId, body);
  }

  @Patch(":id")
  @RequirePermissions("inventory.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.inventory.update(id, req.businessId, body);
  }

  @Delete(":id")
  @RequirePermissions("inventory.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.inventory.remove(id, req.businessId);
  }
}
