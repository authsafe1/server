import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma, Secret } from "@prisma/client";
import dayjs from "dayjs";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async createApiKey(
    data: Omit<Prisma.ApiKeyCreateInput, "token">,
    organization: {
      id: string;
      Secret: Pick<Secret, "privateKey" | "id">;
    },
  ) {
    try {
      const expiresAt = dayjs(data.expiresAt);
      const payload = {
        sub: `authsafe|${organization.id}`,
        iat: dayjs().unix(),
        iss: this.configService.get("API_URL"),
        type: "access",
        exp: expiresAt.unix(),
      };
      const token = await this.jwtService.signAsync(payload, {
        privateKey: organization.Secret.privateKey,
      });
      return await this.prismaService.apiKey.create({
        data: {
          token,
          expiresAt: expiresAt.toDate(),
          Secret: { connect: { id: organization.Secret.id } },
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

  async getAllApiKeys(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ApiKeyWhereUniqueInput;
    where?: Prisma.ApiKeyWhereInput;
    orderBy?: Prisma.ApiKeyOrderByWithRelationInput;
  }) {
    return this.prismaService.apiKey.findMany({
      ...params,
    });
  }

  async getApiKeyById(id: string) {
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

  async deleteApiKey(token: string) {
    const findRole = await this.prismaService.apiKey.findUnique({
      where: { token },
    });
    if (!findRole) {
      throw new NotFoundException(`ApiKey with Token ${token} not found`);
    }
    return await this.prismaService.apiKey.delete({
      where: { token },
    });
  }
}
