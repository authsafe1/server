import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class PermissionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createPermission(data: Prisma.PermissionCreateInput) {
    try {
      const permission = await this.prismaService.permission.create({
        data,
      });
      await this.eventEmitter.emitAsync("permission.created", { permission });
      return permission;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllPermissions(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PermissionWhereUniqueInput;
    where?: Prisma.PermissionWhereInput;
    orderBy?: Prisma.PermissionOrderByWithRelationInput;
  }) {
    return await this.prismaService.permission.findMany({
      ...params,
    });
  }

  async getPermissionById(id: string) {
    try {
      return await this.prismaService.permission.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Permission with ID ${id} not found`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async updatePermission(id: string, data: Prisma.PermissionUpdateInput) {
    const findPermission = await this.prismaService.permission.findUnique({
      where: { id },
    });
    if (!findPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    const permission = await this.prismaService.permission.update({
      where: { id },
      data,
    });
    await this.eventEmitter.emitAsync("permisssion.updated", { permission });
    return permission;
  }

  async deletePermission(id: string) {
    const findPermission = await this.prismaService.permission.findUnique({
      where: { id },
    });
    if (!findPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    const permission = await this.prismaService.permission.delete({
      where: { id },
    });
    await this.eventEmitter.emitAsync("permission.deleted", { permission });
    return permission;
  }
}
