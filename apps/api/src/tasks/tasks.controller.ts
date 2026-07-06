import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(@Request() req) {
    if (req.user.kind === "employee") {
      return this.tasks.findMine(req.user.tenantId, req.user.employeeId);
    }
    return this.tasks.findAll(req.user.tenantId);
  }

  @Post()
  @RequirePermissions("tasks.manage")
  create(@Request() req, @Body() body: any) {
    return this.tasks.create(req.user.tenantId, body);
  }

  @Patch(":id/status")
  @RequirePermissions("tasks.manage")
  updateStatus(@Param("id") id: string, @Request() req, @Body() body: { status: any }) {
    return this.tasks.updateStatus(id, req.user.tenantId, body.status);
  }

  @Delete(":id")
  @RequirePermissions("tasks.manage")
  remove(@Param("id") id: string, @Request() req) {
    return this.tasks.remove(id, req.user.tenantId);
  }
}
