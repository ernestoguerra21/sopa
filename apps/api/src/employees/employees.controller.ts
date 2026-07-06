import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { EmployeesService } from "./employees.service";

@Controller("employees")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermissions("hr.view")
  findAll(@Request() req) {
    return this.employees.findAll(req.businessId);
  }

  @Post()
  @RequirePermissions("hr.manage")
  create(@Request() req, @Body() body: any) {
    return this.employees.create(req.user.tenantId, req.businessId, body);
  }

  @Patch(":id")
  @RequirePermissions("hr.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.employees.update(id, req.businessId, body);
  }

  @Delete(":id")
  @RequirePermissions("hr.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.employees.remove(id, req.businessId);
  }
}
