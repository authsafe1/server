import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { PrismaService } from "../modules/prisma/prisma.service";

@Injectable()
export class EnsureLoginGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    try {
      if (req.session && req.session.organization) {
        const organization =
          await this.prismaService.organization.findUniqueOrThrow({
            where: {
              id: req.session.organization.id,
            },
            include: {
              Secret: { select: { id: true, privateKey: true } },
            },
            omit: { password: true, twoFactorSecret: true },
          });
        req.user = organization;
        return true;
      } else {
        return false;
      }
    } catch (err) {
      if (err.code === "P2025") {
        throw new ForbiddenException("Invalid Session");
      } else {
        throw new ForbiddenException("Invalid Secret");
      }
    }
  }

  private getAuthorizationToken(authorizationHeader: string) {
    if (authorizationHeader) {
      const header = authorizationHeader.split("Bearer ");
      if (!header[1] || header[1] === "") {
        return null;
      } else {
        return header[1];
      }
    } else {
      return null;
    }
  }
}
