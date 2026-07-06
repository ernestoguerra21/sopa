import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

@Injectable()
export class MembersService {
  constructor(private readonly db: PrismaService) {}

  private async orgAndBusiness(tenantId: string) {
    const organization = await this.db.organization.findUnique({
      where: { tenantId },
      include: { businesses: true },
    });
    if (!organization) throw new NotFoundException("Organización no encontrada para este tenant");
    return { organization, business: organization.businesses[0] ?? null };
  }

  async list(tenantId: string) {
    const { organization, business } = await this.orgAndBusiness(tenantId);

    const [orgMembers, businessMembers] = await Promise.all([
      this.db.organizationMember.findMany({
        where: { organizationId: organization.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      business
        ? this.db.businessMember.findMany({
            where: { businessId: business.id },
            include: { user: { select: { id: true, name: true, email: true } } },
          })
        : Promise.resolve([]),
    ]);

    const businessRoleByUserId = new Map(businessMembers.map(m => [m.userId, m.role]));

    return {
      organization: { id: organization.id, name: organization.name },
      business: business ? { id: business.id, name: business.name } : null,
      members: orgMembers.map(m => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        organizationRole: m.role,
        businessRole: businessRoleByUserId.get(m.user.id) ?? null,
      })),
    };
  }

  async invite(
    tenantId: string,
    data: { name: string; email: string; password: string; organizationRole: string; businessRole?: string },
  ) {
    const { organization, business } = await this.orgAndBusiness(tenantId);

    const existing = await this.db.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException("Ya existe un usuario con ese email");

    const user = await this.db.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash(data.password),
        role: "MANAGER",
        tenantId,
      },
    });

    await this.db.organizationMember.create({
      data: { userId: user.id, organizationId: organization.id, role: data.organizationRole as any },
    });

    if (data.businessRole && business) {
      await this.db.businessMember.create({
        data: { userId: user.id, businessId: business.id, role: data.businessRole as any },
      });
    }

    return { id: user.id, name: user.name, email: user.email };
  }

  async updateRoles(
    tenantId: string,
    userId: string,
    data: { organizationRole?: string; businessRole?: string | null },
  ) {
    const { organization, business } = await this.orgAndBusiness(tenantId);

    if (data.organizationRole) {
      await this.db.organizationMember.update({
        where: { userId_organizationId: { userId, organizationId: organization.id } },
        data: { role: data.organizationRole as any },
      });
    }

    if (business && data.businessRole !== undefined) {
      if (data.businessRole === null) {
        await this.db.businessMember.deleteMany({ where: { userId, businessId: business.id } });
      } else {
        await this.db.businessMember.upsert({
          where: { userId_businessId: { userId, businessId: business.id } },
          update: { role: data.businessRole as any },
          create: { userId, businessId: business.id, role: data.businessRole as any },
        });
      }
    }

    return { ok: true };
  }

  async remove(tenantId: string, userId: string) {
    const { organization } = await this.orgAndBusiness(tenantId);

    const member = await this.db.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: organization.id } },
    });
    if (member?.role === "OWNER") {
      const ownerCount = await this.db.organizationMember.count({
        where: { organizationId: organization.id, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException("No puedes eliminar al único propietario de la organización");
      }
    }

    await this.db.businessMember.deleteMany({ where: { userId } });
    await this.db.organizationMember.deleteMany({ where: { userId, organizationId: organization.id } });
    await this.db.user.deleteMany({ where: { id: userId, tenantId } });

    return { ok: true };
  }
}
