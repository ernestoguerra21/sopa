import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InventoryService } from "./inventory.service";

@Controller("inventory")
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  findAll(@Request() req) {
    return this.inventory.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.inventory.create(req.user.tenantId, body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    return this.inventory.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.inventory.remove(id, req.user.tenantId);
  }
}
