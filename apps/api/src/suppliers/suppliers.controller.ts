import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @RequirePermissions("suppliers.manage")
  findAll(@Request() req) {
    return this.suppliers.findAll(req.businessId);
  }

  @Post()
  @RequirePermissions("suppliers.manage")
  create(@Request() req, @Body() body: any) {
    return this.suppliers.create(req.user.tenantId, req.businessId, body);
  }

  @Patch(":id")
  @RequirePermissions("suppliers.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.suppliers.update(id, req.businessId, body);
  }

  @Delete(":id")
  @RequirePermissions("suppliers.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.suppliers.remove(id, req.businessId);
  }
}
