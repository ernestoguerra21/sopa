import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/require-permissions.decorator";
import { MembersService } from "./members.service";

@Controller("members")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @RequirePermissions("users.manage")
  list(@Request() req) {
    return this.members.list(req.user.tenantId);
  }

  @Post()
  @RequirePermissions("users.manage")
  invite(@Request() req, @Body() body: any) {
    return this.members.invite(req.user.tenantId, body);
  }

  @Patch(":userId")
  @RequirePermissions("roles.manage")
  updateRoles(@Param("userId") userId: string, @Request() req, @Body() body: any) {
    return this.members.updateRoles(req.user.tenantId, userId, body);
  }

  @Delete(":userId")
  @RequirePermissions("users.manage")
  remove(@Param("userId") userId: string, @Request() req) {
    return this.members.remove(req.user.tenantId, userId);
  }
}
