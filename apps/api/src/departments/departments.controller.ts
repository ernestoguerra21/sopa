import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DepartmentsService } from "./departments.service";

@Controller("departments")
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  findAll(@Request() req) {
    return this.departments.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.departments.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.departments.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.departments.remove(id, req.user.tenantId);
  }
}
