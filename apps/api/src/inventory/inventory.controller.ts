import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { InventoryService } from "./inventory.service";
import { CreateInventoryItemDto, CreateStockMovementDto, UpdateInventoryItemDto } from "../common/dto";

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
  create(@Request() req, @Body() body: CreateInventoryItemDto) {
    return this.inventory.create(req.user.tenantId, req.businessId, body);
  }

  @Get(":id/movements")
  @RequirePermissions("inventory.view")
  listMovements(@Param("id") id: string, @Request() req) {
    return this.inventory.listMovements(id, req.businessId);
  }

  @Post(":id/movements")
  @RequirePermissions("inventory.manage")
  createMovement(@Param("id") id: string, @Request() req, @Body() body: CreateStockMovementDto) {
    // cantidad siempre positiva en la petición; el signo lo decide el tipo
    const sign = body.type === "SALIDA" || body.type === "MERMA" ? -1 : 1;
    return this.inventory.registerMovement(
      id,
      req.user.tenantId,
      req.businessId,
      sign * body.quantity,
      body.type,
      body.note,
    );
  }

  @Patch(":id")
  @RequirePermissions("inventory.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: UpdateInventoryItemDto) {
    return this.inventory.update(id, req.user.tenantId, req.businessId, body);
  }

  @Delete(":id")
  @RequirePermissions("inventory.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.inventory.remove(id, req.businessId);
  }
}
