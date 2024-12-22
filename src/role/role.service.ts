import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class RoleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createRole(data: Prisma.RoleCreateInput) {
    try {
      const role = await this.prismaService.role.create({
        data,
      });
      await this.eventEmitter.emitAsync("role.created", { role });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllRoles(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.RoleWhereUniqueInput;
    where?: Prisma.RoleWhereInput;
    orderBy?: Prisma.RoleOrderByWithRelationInput;
  }) {
    return this.prismaService.role.findMany({
      ...params,
    });
  }

  async getRoleById(id: string) {
    try {
      return await this.prismaService.role.findUniqueOrThrow({
        where: { id },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`Role with ID ${id} not found`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async updateRole(id: string, data: Prisma.RoleUpdateInput) {
    const findRole = await this.prismaService.role.findUnique({
      where: { id },
    });
    if (!findRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    const role = this.prismaService.role.update({
      where: { id },
      data,
    });
    await this.eventEmitter.emitAsync("role.updated", { role });
    return role;
  }

  async deleteRole(id: string) {
    const findRole = await this.prismaService.role.findUnique({
      where: { id },
    });
    if (!findRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    const role = this.prismaService.role.delete({
      where: { id },
    });
    await this.eventEmitter.emitAsync("role.deleted", { role });
    return role;
  }
}
