import { Body, Controller, Get, Patch, Post, Delete, Param, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { PayrollService } from "./payroll.service";

@Controller("payroll")
@UseGuards(JwtAuthGuard, BusinessContextGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payroll: PayrollService) {}

  @Post("calculate/:employeeId")
  @RequirePermissions("hr.manage")
  async calculate(
    @Param("employeeId") employeeId: string,
    @Query("month") month: string,
    @Query("year") year: string
  ) {
    return this.payroll.calculate(employeeId, parseInt(month), parseInt(year));
  }

  @Post("generate/:employeeId")
  @RequirePermissions("hr.manage")
  async generate(
    @Param("employeeId") employeeId: string,
    @Query("month") month: string,
    @Query("year") year: string,
    @Request() req
  ) {
    return this.payroll.generate(employeeId, parseInt(month), parseInt(year), req.user.tenantId);
  }

  @Get()
  @RequirePermissions("hr.view")
  async list(@Request() req, @Query("month") month?: string, @Query("year") year?: string) {
    return this.payroll.list(
      req.user.tenantId,
      req.businessId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined
    );
  }

  @Get("employee/:employeeId")
  @RequirePermissions("hr.view")
  async getForEmployee(@Param("employeeId") employeeId: string, @Request() req) {
    return this.payroll.getForEmployee(employeeId, req.user.tenantId);
  }

  @Patch(":id")
  @RequirePermissions("hr.manage")
  async update(
    @Param("id") id: string,
    @Request() req,
    @Body() body: { grossSalary?: number; otherDeductions?: number; socialSecurityDeduction?: number; incomeTaxDeduction?: number }
  ) {
    return this.payroll.update(id, req.user.tenantId, body);
  }

  @Delete(":id")
  @RequirePermissions("hr.manage")
  async delete(@Param("id") id: string, @Request() req) {
    return this.payroll.delete(id, req.user.tenantId);
  }
}
