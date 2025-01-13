import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Cache } from "cache-manager";
import { Request, Response } from "express";
import { CacheInvalidate } from "../common/decorators/cache.decorator";
import {
  CreateOrganizationDto,
  OrganizationsDto,
  UpdateOrganizationDto,
} from "../common/dtos/organization.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { OrganizationService } from "./organization.service";

@UseGuards(EnsureLoginGuard)
@Controller("organization")
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post("create")
  @CacheInvalidate("isAuthenticated")
  async createUser(@Body() dto: CreateOrganizationDto, @Req() req: Request) {
    return await this.organizationService.createOrganization({
      ...dto,
      Profile: {
        connect: {
          id: req.session.profile.id,
        },
      },
    });
  }

  @Post("all")
  async findAll(@Body() dto: OrganizationsDto, @Req() req: Request) {
    return this.organizationService.getAllOrganizations(
      dto,
      req.session?.profile?.id,
    );
  }

  @Get("count")
  async getCount(@Req() req: Request) {
    return this.organizationService.countOrganizations({
      profileId: req.session?.profile?.id,
    });
  }

  @Put("update/:id")
  @CacheInvalidate("isAuthenticated")
  async updateOrganization(
    @Param("id") id: string,
    @Req() req: Request,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return await this.organizationService.updateOrganization({
      where: { id, profileId: req.session?.profile?.id },
      data: dto,
    });
  }

  @Delete("delete/:id")
  @CacheInvalidate("isAuthenticated")
  async deleteOrganization(
    @Param("id") id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    await this.organizationService.deleteOrganization({
      id,
      profileId: req.session?.profile?.id,
    });
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: "Internal Server Error" });
        }
        res.clearCookie("__session");
        return { message: "Organization Deleted" };
      });
    } else {
      return { message: "Organization Deleted" };
    }
  }

  @Get("switch/:id")
  async getOrganization(@Param("id") id: string, @Req() req: Request) {
    const organization = await this.organizationService.switchOrganization(
      id,
      req.session?.profile?.id,
    );
    req.session.organization = {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      Secret: {
        privateKey: organization.Secret.privateKey,
        id: organization.Secret.id,
      },
      metadata: organization.metadata,
    };
    return {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      metadata: organization.metadata,
      Secret: {
        publicKey: organization.Secret.publicKey,
        ApiKeys: organization.Secret.ApiKeys,
      },
    };
  }
}
