import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  findAll(@Request() req) {
    return this.suppliers.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.suppliers.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.suppliers.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.suppliers.remove(id, req.user.tenantId);
  }
}
