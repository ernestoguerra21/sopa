import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const hashed = hash(password);

    const user = await this.db.user.findUnique({
      where: { email },
      include: { tenant: true, organizationMemberships: true, businessMemberships: true },
    });
    if (user && user.password === hashed) {
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        kind: "user",
        organizationRoles: user.organizationMemberships.map(m => m.role),
        businessRoles: user.businessMemberships.map(m => m.role),
        businessIds: user.businessMemberships.map(m => m.businessId),
      };
      return {
        accessToken: this.jwt.sign(payload),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant: { id: user.tenant.id, name: user.tenant.name },
          kind: "user",
          organizationRoles: payload.organizationRoles,
          businessRoles: payload.businessRoles,
        },
      };
    }

    const employee = await this.db.employee.findUnique({ where: { email }, include: { tenant: true } });
    if (employee && employee.password && employee.password === hashed) {
      const payload = {
        sub: employee.id,
        email: employee.email,
        role: "EMPLOYEE",
        tenantId: employee.tenantId,
        kind: "employee",
        employeeId: employee.id,
      };
      return {
        accessToken: this.jwt.sign(payload),
        user: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          role: "EMPLOYEE",
          tenant: { id: employee.tenant.id, name: employee.tenant.name },
          kind: "employee",
        },
      };
    }

    throw new UnauthorizedException("Credenciales incorrectas");
  }

  async me(reqUser: { sub: string; kind?: string }) {
    if (reqUser.kind === "employee") {
      const employee = await this.db.employee.findUnique({ where: { id: reqUser.sub }, include: { tenant: true } });
      if (!employee) throw new UnauthorizedException();
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: "EMPLOYEE",
        tenant: { id: employee.tenant.id, name: employee.tenant.name },
        kind: "employee",
        payRateType: employee.payRateType,
      };
    }

    const user = await this.db.user.findUnique({
      where: { id: reqUser.sub },
      include: { tenant: true, organizationMemberships: true, businessMemberships: true },
    });
    if (!user) throw new UnauthorizedException();
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant: { id: user.tenant.id, name: user.tenant.name },
      kind: "user",
      organizationRoles: user.organizationMemberships.map(m => m.role),
      businessRoles: user.businessMemberships.map(m => m.role),
    };
  }
}
