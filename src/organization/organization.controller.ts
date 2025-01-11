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
  ActivityLogDto,
  AuthorizationLogDto,
  SecurityAlertDto,
} from "../common/dtos/log.dto";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from "../common/dtos/organization.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { AuthorizationLogService } from "../common/modules/log/authorization-log.service";
import { SecurityAlertService } from "../common/modules/log/security-log.service";
import { OrganizationService } from "./organization.service";

@Controller("organization")
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly securityAlertService: SecurityAlertService,
    private readonly authorizationLogService: AuthorizationLogService,
    private readonly activityLogService: ActivityLogService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Post("create")
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

  @UseGuards(EnsureLoginGuard)
  @Put("update/:id")
  @CacheInvalidate("isAuthenticated")
  async updateOrganization(
    @Param("id") id: string,
    @Req() req: Request,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return await this.organizationService.updateOrganization({
      where: { id, profileId: req.session.profile.id },
      data: dto,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Delete("delete")
  @CacheInvalidate("isAuthenticated")
  async deleteOrganization(@Req() req: Request, @Res() res: Response) {
    await this.organizationService.deleteOrganization({
      id: req.session.organization.id,
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

  @UseGuards(EnsureLoginGuard)
  @Get("log/activity/data")
  async getActivityData(@Req() req: Request) {
    return await this.activityLogService.getUserActivityOverTime(
      req.session?.organization?.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/security/all")
  async getAllSecurityLogs(@Req() req: Request, @Body() dto: SecurityAlertDto) {
    const { where, ...params } = dto;
    return await this.securityAlertService.getAllSecurityAlerts({
      where: {
        ...where,
        organizationId: req.session?.organization?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/security/count")
  async countSecurityLogs(@Req() req: Request) {
    return await this.securityAlertService.countSecurityAlerts({
      organizationId: req.session?.organization?.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/authorization/all")
  async getAllAuthorizationLogs(
    @Req() req: Request,
    @Body() dto: AuthorizationLogDto,
  ) {
    const { where, ...params } = dto;
    return await this.authorizationLogService.getAllAuthorizationLogs({
      where: {
        ...where,
        organizationId: req.session?.organization?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/authorization/count")
  async countAuthorizationLogs(@Req() req: Request) {
    return await this.authorizationLogService.countAuthorizationLogs({
      organizationId: req.session?.organization?.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/activity/all")
  async getAllActivityLogs(@Req() req: Request, @Body() dto: ActivityLogDto) {
    const { where, ...params } = dto;
    return await this.activityLogService.getAllActivityLogs({
      where: {
        ...where,
        organizationId: req.session?.organization?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/activity/count")
  async countActivityLogs(@Req() req: Request) {
    return await this.activityLogService.countActivityLogs({
      organizationId: req.session?.organization?.id,
    });
  }
}
