import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TimeEntriesService } from "./time-entries.service";

@Controller("time-entries")
@UseGuards(JwtAuthGuard)
export class TimeEntriesController {
  constructor(private readonly timeEntries: TimeEntriesService) {}

  @Get()
  findAll(
    @Request() req,
    @Query("employeeId") employeeId: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.timeEntries.findAll(req.user.tenantId, employeeId, from, to);
  }

  @Post()
  create(@Request() req, @Body() body: any) {
    return this.timeEntries.create(req.user.tenantId, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.timeEntries.remove(id, req.user.tenantId);
  }
}
