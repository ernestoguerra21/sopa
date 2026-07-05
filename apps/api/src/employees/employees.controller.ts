import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { EmployeesService } from "./employees.service";

@Controller("employees")
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  findAll(@Request() req) {
    return this.employees.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.employees.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.employees.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.employees.remove(id, req.user.tenantId);
  }
}
