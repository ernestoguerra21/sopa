import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TasksService } from "./tasks.service";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  findAll(@Request() req) {
    return this.tasks.findAll(req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.tasks.create(req.user.tenantId, body);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Request() req, @Body() body: { status: any }) {
    return this.tasks.updateStatus(id, req.user.tenantId, body.status);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.tasks.remove(id, req.user.tenantId);
  }
}
