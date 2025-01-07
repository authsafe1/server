import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { promisify } from "util";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createApiKey(
    data: Omit<Prisma.ApiKeyCreateInput, "token">,
    secretId: string,
  ) {
    try {
      const expiresAt = dayjs(data.expiresAt);
      const token = await this.generateToken();
      return await this.prismaService.apiKey.create({
        data: {
          ...data,
          token,
          expiresAt: expiresAt.toDate(),
          Secret: { connect: { id: secretId } },
        },
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async countApiKeys(where: Prisma.ApiKeyWhereInput) {
    try {
      return await this.prismaService.apiKey.count({
        where,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async getAllApiKeys(
    params: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ApiKeyWhereUniqueInput;
      where?: Prisma.ApiKeyWhereInput;
      orderBy?: Prisma.ApiKeyOrderByWithRelationInput;
    },
    secretId: string,
  ) {
    const { where, ...paramsWithoutWhere } = params;
    return this.prismaService.apiKey.findMany({
      ...paramsWithoutWhere,
      where: {
        ...where,
        secretId,
      },
    });
  }

  async getApiKeyByToken(token: string, secretId: string) {
    try {
      return await this.prismaService.apiKey.findUniqueOrThrow({
        where: { token, secretId },
      });
    } catch (error) {
      if (error.code === "P2025") {
        throw new NotFoundException(`ApiKey with Token ${token} not found`);
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async deleteApiKey(token: string, secretId: string) {
    const findApiKey = await this.prismaService.apiKey.findUnique({
      where: { token, secretId },
    });
    if (!findApiKey) {
      throw new NotFoundException(`ApiKey with Token ${token} not found`);
    }
    return await this.prismaService.apiKey.delete({
      where: { token },
    });
  }

  private async generateToken() {
    return (await promisify(randomBytes)(32)).toString("hex");
  }
}
