import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { EmployeesService } from "./employees.service";

@Controller("employees")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @RequirePermissions("hr.view")
  findAll(@Request() req) {
    return this.employees.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermissions("hr.manage")
  create(@Request() req, @Body() body: any) {
    return this.employees.create(req.user.tenantId, body);
  }

  @Patch(":id")
  @RequirePermissions("hr.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.employees.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  @RequirePermissions("hr.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.employees.remove(id, req.user.tenantId);
  }
}
