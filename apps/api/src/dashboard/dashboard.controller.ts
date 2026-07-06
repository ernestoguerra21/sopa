import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("summary")
  @RequirePermissions("dashboard.view")
  summary(@Request() req) {
    return this.dashboard.getSummary(req.businessId);
  }

  @Get("alerts")
  @RequirePermissions("dashboard.view")
  alerts(@Request() req) {
    return this.dashboard.getAlerts(req.businessId);
  }

  @Delete("alerts/:id")
  @RequirePermissions("dashboard.view")
  dismissAlert(@Param("id") id: string, @Request() req) {
    return this.dashboard.dismissAlert(id, req.businessId);
  }

  @Post("sales-entry")
  @RequirePermissions("sales.edit")
  createSalesEntry(
    @Request() req,
    @Body() body: { sales: number; expenses: number; notes?: string },
  ) {
    return this.dashboard.createSalesEntry(req.user.tenantId, req.businessId, body);
  }
}
