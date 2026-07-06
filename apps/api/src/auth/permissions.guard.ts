import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_PERMISSIONS_KEY } from "./require-permissions.decorator";
import {
  BUSINESS_ROLE_PERMISSIONS,
  ORGANIZATION_ROLE_PERMISSIONS,
  Permission,
} from "./permissions";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const permissions = new Set<Permission>();

    for (const role of user.organizationRoles ?? []) {
      for (const permission of ORGANIZATION_ROLE_PERMISSIONS[role] ?? []) {
        permissions.add(permission);
      }
    }

    for (const role of user.businessRoles ?? []) {
      for (const permission of BUSINESS_ROLE_PERMISSIONS[role] ?? []) {
        permissions.add(permission);
      }
    }

    const allowed = required.every(permission => permissions.has(permission));

    if (!allowed) {
      throw new ForbiddenException("No tienes permisos para realizar esta acción");
    }

    return true;
  }
}
