import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const ORG_WIDE_ROLES = ["OWNER", "ADMIN_ORG"];

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "negocio";
}

@Injectable()
export class BusinessesService {
  constructor(private readonly db: PrismaService) {}

  private async orgFor(tenantId: string) {
    const organization = await this.db.organization.findUnique({ where: { tenantId } });
    if (!organization) throw new NotFoundException("Organización no encontrada para este tenant");
    return organization;
  }

  async list(tenantId: string, organizationRoles: string[], businessIds: string[]) {
    const organization = await this.orgFor(tenantId);
    const businesses = await this.db.business.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "asc" },
    });

    const orgWide = organizationRoles.some(r => ORG_WIDE_ROLES.includes(r));
    return orgWide ? businesses : businesses.filter(b => businessIds.includes(b.id));
  }

  async create(tenantId: string, data: { name: string }) {
    const organization = await this.orgFor(tenantId);
    let slug = slugify(data.name);
    const existing = await this.db.business.count({ where: { organizationId: organization.id, slug } });
    if (existing > 0) slug = `${slug}-${existing + 1}`;

    return this.db.business.create({
      data: { name: data.name, slug, organizationId: organization.id },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string }) {
    const organization = await this.orgFor(tenantId);
    return this.db.business.updateMany({
      where: { id, organizationId: organization.id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    const organization = await this.orgFor(tenantId);
    const business = await this.db.business.findFirst({ where: { id, organizationId: organization.id } });
    if (!business) throw new NotFoundException("Negocio no encontrado");

    const businessCount = await this.db.business.count({ where: { organizationId: organization.id } });
    if (businessCount <= 1) {
      throw new BadRequestException("No puedes eliminar el único negocio de la organización");
    }

    const [employees, inventory] = await Promise.all([
      this.db.employee.count({ where: { businessId: id } }),
      this.db.inventoryItem.count({ where: { businessId: id } }),
    ]);
    if (employees > 0 || inventory > 0) {
      throw new BadRequestException("Este negocio todavía tiene empleados o inventario — vacíalo antes de eliminarlo");
    }

    await this.db.businessMember.deleteMany({ where: { businessId: id } });
    await this.db.business.delete({ where: { id } });
    return { ok: true };
  }
}
