import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { TimeOffService } from "./time-off.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BusinessContextGuard } from "../auth/business-context.guard";
import { CreateTimeOffDto } from "../common/dto";

@Controller("time-off")
@UseGuards(JwtAuthGuard, BusinessContextGuard)
export class TimeOffController {
  constructor(private timeOffService: TimeOffService) {}

  @Post()
  async create(@Req() req: any, @Body() data: CreateTimeOffDto) {
    return this.timeOffService.create(req.user.tenantId, req.businessId, data);
  }

  @Get("calendar")
  async getCalendar(
    @Req() req: any,
    @Query("month") month: string,
    @Query("year") year: string
  ) {
    return this.timeOffService.getCalendar(
      req.user.tenantId,
      req.businessId,
      parseInt(month),
      parseInt(year)
    );
  }

  @Get()
  async list(
    @Req() req: any,
    @Query("employeeId") employeeId?: string,
    @Query("status") status?: string
  ) {
    if (employeeId) {
      return this.timeOffService.listByEmployee(
        req.user.tenantId,
        req.businessId,
        employeeId,
        status as any
      );
    }
    return this.timeOffService.listByBusiness(req.user.tenantId, req.businessId, status as any);
  }

  @Patch(":id/approve")
  async approve(@Req() req: any, @Param("id") id: string) {
    return this.timeOffService.approve(
      req.user.tenantId,
      req.businessId,
      id,
      req.user.id
    );
  }

  @Patch(":id/reject")
  async reject(@Req() req: any, @Param("id") id: string) {
    return this.timeOffService.reject(req.user.tenantId, req.businessId, id);
  }

  @Delete(":id")
  async delete(@Req() req: any, @Param("id") id: string) {
    await this.timeOffService.delete(req.user.tenantId, req.businessId, id);
    return { ok: true };
  }
}
