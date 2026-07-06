import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";

function hash(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

@Injectable()
export class MembersService {
  constructor(private readonly db: PrismaService) {}

  private async orgFor(tenantId: string) {
    const organization = await this.db.organization.findUnique({ where: { tenantId } });
    if (!organization) throw new NotFoundException("Organización no encontrada para este tenant");
    return organization;
  }

  async list(tenantId: string) {
    const organization = await this.orgFor(tenantId);
    const businesses = await this.db.business.findMany({ where: { organizationId: organization.id } });
    const businessIds = businesses.map(b => b.id);
    const businessNameById = new Map(businesses.map(b => [b.id, b.name]));

    const [orgMembers, businessMembers] = await Promise.all([
      this.db.organizationMember.findMany({
        where: { organizationId: organization.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      businessIds.length
        ? this.db.businessMember.findMany({
            where: { businessId: { in: businessIds } },
            include: { user: { select: { id: true, name: true, email: true } } },
          })
        : Promise.resolve([]),
    ]);

    const businessRolesByUserId = new Map<string, { businessId: string; businessName: string; role: string }[]>();
    for (const bm of businessMembers) {
      const list = businessRolesByUserId.get(bm.userId) ?? [];
      list.push({ businessId: bm.businessId, businessName: businessNameById.get(bm.businessId) ?? "", role: bm.role });
      businessRolesByUserId.set(bm.userId, list);
    }

    return {
      organization: { id: organization.id, name: organization.name },
      businesses: businesses.map(b => ({ id: b.id, name: b.name })),
      members: orgMembers.map(m => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        organizationRole: m.role,
        businessRoles: businessRolesByUserId.get(m.user.id) ?? [],
      })),
    };
  }

  async invite(
    tenantId: string,
    data: { name: string; email: string; password: string; organizationRole: string; businessId?: string; businessRole?: string },
  ) {
    const organization = await this.orgFor(tenantId);

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

    if (data.businessRole && data.businessId) {
      await this.db.businessMember.create({
        data: { userId: user.id, businessId: data.businessId, role: data.businessRole as any },
      });
    }

    return { id: user.id, name: user.name, email: user.email };
  }

  async updateRoles(
    tenantId: string,
    userId: string,
    data: { organizationRole?: string; businessId?: string; businessRole?: string | null },
  ) {
    const organization = await this.orgFor(tenantId);

    if (data.organizationRole) {
      await this.db.organizationMember.update({
        where: { userId_organizationId: { userId, organizationId: organization.id } },
        data: { role: data.organizationRole as any },
      });
    }

    if (data.businessId && data.businessRole !== undefined) {
      if (data.businessRole === null) {
        await this.db.businessMember.deleteMany({ where: { userId, businessId: data.businessId } });
      } else {
        await this.db.businessMember.upsert({
          where: { userId_businessId: { userId, businessId: data.businessId } },
          update: { role: data.businessRole as any },
          create: { userId, businessId: data.businessId, role: data.businessRole as any },
        });
      }
    }

    return { ok: true };
  }

  async remove(tenantId: string, userId: string) {
    const organization = await this.orgFor(tenantId);

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
