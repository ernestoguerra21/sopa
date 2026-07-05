import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  summary(@Request() req) {
    return this.dashboard.getSummary(req.user.tenantId);
  }

  @Get("alerts")
  alerts(@Request() req) {
    return this.dashboard.getAlerts(req.user.tenantId);
  }

  @Delete("alerts/:id")
  dismissAlert(@Param("id") id: string, @Request() req) {
    return this.dashboard.dismissAlert(id, req.user.tenantId);
  }

  @Post("sales-entry")
  createSalesEntry(
    @Request() req,
    @Body() body: { sales: number; expenses: number; notes?: string },
  ) {
    return this.dashboard.createSalesEntry(req.user.tenantId, body);
  }
}
