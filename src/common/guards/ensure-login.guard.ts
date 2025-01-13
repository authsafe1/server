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

    const token = this.getAuthorizationToken(req.headers.authorization);

    try {
      if (token) {
        const apiKey = await this.prismaService.apiKey.findFirstOrThrow({
          where: {
            token,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            Secret: {
              include: { Organization: { include: { Profile: true } } },
            },
          },
        });
        req.session.profile = {
          id: apiKey.Secret.Organization.Profile.id,
          name: apiKey.Secret.Organization.Profile.name,
          email: apiKey.Secret.Organization.Profile.email,
        };
        return true;
      } else if (req.session && req.session.profile) {
        const profile = await this.prismaService.profile.findUniqueOrThrow({
          where: {
            id: req.session.profile.id,
          },

          omit: { password: true, twoFactorSecret: true },
        });
        req.user = profile;
        return true;
      } else {
        return false;
      }
    } catch (err) {
      if (err.code === "P2025") {
        throw new ForbiddenException("Invalid Session");
      } else {
        throw new ForbiddenException("Invalid Api Key");
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
