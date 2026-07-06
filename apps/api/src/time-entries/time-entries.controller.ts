import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { TimeEntriesService } from "./time-entries.service";

@Controller("time-entries")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimeEntriesController {
  constructor(private readonly timeEntries: TimeEntriesService) {}

  @Get()
  findAll(
    @Request() req,
    @Query("employeeId") employeeId: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const targetEmployeeId = req.user.kind === "employee" ? req.user.employeeId : employeeId;
    return this.timeEntries.findAll(req.user.tenantId, targetEmployeeId, from, to);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    if (req.user.kind !== "employee") {
      throw new ForbiddenException("Solo el trabajador puede fichar su propio horario");
    }
    return this.timeEntries.create(req.user.tenantId, { ...body, employeeId: req.user.employeeId });
  }

  @Patch(":id")
  @RequirePermissions("hr.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: any) {
    if (req.user.kind === "employee") {
      throw new ForbiddenException("Solo un administrador puede corregir fichajes");
    }
    return this.timeEntries.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  @RequirePermissions("hr.manage")
  remove(@Param("id") id: string, @Request() req) {
    if (req.user.kind === "employee") {
      throw new ForbiddenException("Solo un administrador puede eliminar fichajes");
    }
    return this.timeEntries.remove(id, req.user.tenantId);
  }
}
