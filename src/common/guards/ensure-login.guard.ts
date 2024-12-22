import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { PrismaService } from "../modules/prisma/prisma.service";

@Injectable()
export class EnsureLoginGuard implements CanActivate {
  constructor(private readonly prismaService: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    try {
      if (req.session && req.session.organization) {
        const organization =
          await this.prismaService.organization.findUniqueOrThrow({
            where: {
              id: req.session.organization.id,
            },
            omit: { password: true, twoFactorSecret: true },
          });
        req.user = organization;
        return true;
      } else {
        res.locals.redirectedByGuard = true;
        res.status(401).redirect("/auth/signin");
        return false;
      }
    } catch (err) {
      if (err.code === "P2025") {
        res.locals.redirectedByGuard = true;
        res.status(401).redirect("/auth/signin");
        return false;
      }
      throw new ForbiddenException();
    }
  }
}
