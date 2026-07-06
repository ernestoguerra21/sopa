import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { BusinessesService } from "./businesses.service";

@Controller("businesses")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Get()
  @RequirePermissions("business.view")
  list(@Request() req) {
    return this.businesses.list(req.user.tenantId, req.user.organizationRoles ?? [], req.user.businessIds ?? []);
  }

  @Post()
  @RequirePermissions("business.manage")
  create(@Request() req, @Body() body: { name: string }) {
    return this.businesses.create(req.user.tenantId, body);
  }

  @Patch(":id")
  @RequirePermissions("business.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: { name?: string }) {
    return this.businesses.update(req.user.tenantId, id, body);
  }

  @Delete(":id")
  @RequirePermissions("business.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.businesses.remove(req.user.tenantId, id);
  }
}
