import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class BrandingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async updateBranding(
    where: Prisma.BrandingWhereUniqueInput,
    data: Prisma.BrandingUpdateInput,
  ) {
    return await this.prismaService.branding.update({ where, data });
  }

  async getBranding(where: Prisma.BrandingWhereUniqueInput) {
    try {
      return await this.prismaService.branding.findUniqueOrThrow({
        where,
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException();
      } else {
        throw new InternalServerErrorException();
      }
    }
  }
}
