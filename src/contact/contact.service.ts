import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/common/modules/prisma/prisma.service";

@Injectable()
export class ContactService {
  constructor(private readonly prismaService: PrismaService) {}

  async contactSales(data: Prisma.SalesContactCreateInput) {
    try {
      await this.prismaService.salesContact.create({
        data,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async contactEngineering(data: Prisma.EngineeringContactCreateInput) {
    try {
      await this.prismaService.engineeringContact.create({
        data,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }
}
