import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const ORG_WIDE_ROLES = ["OWNER", "ADMIN_ORG"];

@Injectable()
export class BusinessContextGuard implements CanActivate {
  constructor(private readonly db: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (user.kind === "employee") {
      const employee = await this.db.employee.findUnique({
        where: { id: user.employeeId },
        select: { businessId: true },
      });
      if (!employee) throw new UnauthorizedException();
      req.businessId = employee.businessId;
      return true;
    }

    const requestedBusinessId = req.headers["x-business-id"];
    if (!requestedBusinessId) {
      throw new BadRequestException("Falta el encabezado X-Business-Id");
    }

    const orgWide = (user.organizationRoles ?? []).some((r: string) => ORG_WIDE_ROLES.includes(r));
    if (orgWide) {
      const business = await this.db.business.findUnique({
        where: { id: requestedBusinessId },
        include: { organization: true },
      });
      if (!business || business.organization.tenantId !== user.tenantId) {
        throw new ForbiddenException("Ese negocio no pertenece a tu organización");
      }
      req.businessId = requestedBusinessId;
      return true;
    }

    const businessIds: string[] = user.businessIds ?? [];
    if (!businessIds.includes(requestedBusinessId)) {
      throw new ForbiddenException("No tienes acceso a ese negocio");
    }
    req.businessId = requestedBusinessId;
    return true;
  }
}
