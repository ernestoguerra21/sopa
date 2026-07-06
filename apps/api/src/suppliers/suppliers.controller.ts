import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @RequirePermissions("suppliers.manage")
  findAll(@Request() req) {
    return this.suppliers.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermissions("suppliers.manage")
  create(@Request() req, @Body() body: any) {
    return this.suppliers.create(req.user.tenantId, body);
  }

  @Patch(":id")
  @RequirePermissions("suppliers.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.suppliers.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  @RequirePermissions("suppliers.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.suppliers.remove(id, req.user.tenantId);
  }
}
