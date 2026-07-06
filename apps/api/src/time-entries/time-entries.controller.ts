import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { TimeEntriesService } from "./time-entries.service";
import { CreateTimeEntryDto, UpdateTimeEntryDto } from "../common/dto";

@Controller("time-entries")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
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
    return this.timeEntries.findAll(req.businessId, targetEmployeeId, from, to);
  }

  @Post()
  create(@Request() req, @Body() body: CreateTimeEntryDto) {
    if (req.user.kind !== "employee") {
      throw new ForbiddenException("Solo el trabajador puede fichar su propio horario");
    }
    return this.timeEntries.create(req.user.tenantId, req.businessId, { ...body, employeeId: req.user.employeeId });
  }

  @Patch(":id")
  @RequirePermissions("hr.manage")
  update(@Param("id") id: string, @Request() req, @Body() body: UpdateTimeEntryDto) {
    if (req.user.kind === "employee") {
      throw new ForbiddenException("Solo un administrador puede corregir fichajes");
    }
    return this.timeEntries.update(id, req.businessId, body);
  }

  @Delete(":id")
  @RequirePermissions("hr.manage")
  remove(@Param("id") id: string, @Request() req) {
    if (req.user.kind === "employee") {
      throw new ForbiddenException("Solo un administrador puede eliminar fichajes");
    }
    return this.timeEntries.remove(id, req.businessId);
  }
}
