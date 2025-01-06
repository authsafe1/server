import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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
  UpdateBranding,
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
  async createUser(@Body() dto: CreateOrganizationDto) {
    return await this.organizationService.createOrganization(dto);
  }

  @Post("google/create")
  //@CacheInvalidate("isAuthenticated")
  async createUserFromGoogle(
    @Body() dto: CreateOrganizationDto,
    @Req() req: Request,
  ) {
    const organization =
      await this.organizationService.createOrganizationDirectly(dto);
    req.session.organization = {
      id: organization.id,
      name: organization.name,
      domain: organization.domain,
      email: organization.email,
      metadata: organization.metadata,
      Secret: organization.Secret,
    };
    return organization;
  }

  @Post("confirm")
  @CacheInvalidate("isAuthenticated")
  async verifyOrganization(@Query("token") token: string, @Req() req: Request) {
    return await this.organizationService.verifyOrganizationCreation(
      token,
      req.ip ||
        (req.headers["x-forwarded-for"] as string) ||
        (req.socket.remoteAddress as string),
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Put("branding/update")
  async updateBranding(@Req() req: Request, @Body() dto: UpdateBranding) {
    return await this.organizationService.updateBranding(
      { organizationId: req.session?.organization?.id },
      dto,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Get("branding")
  async getBranding(
    @Query("organizationId") organizationId: string,
    @Req() req: Request,
  ) {
    return await this.organizationService.getBranding({
      organizationId: req.session?.organization?.id || organizationId,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Put("update")
  @CacheInvalidate("isAuthenticated")
  async updateOrganization(
    @Req() req: Request,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return await this.organizationService.updateOrganization({
      where: { id: req.session.organization.id },
      data: dto,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("upload/photo")
  @UseInterceptors(FileInterceptor("file"))
  @CacheInvalidate("isAuthenticated")
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    return await this.organizationService.updateProfilePhoto({
      where: { id: req.session.organization.id },
      file,
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
      organizationId: req.session.organization.id,
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
      organizationId: req.session.organization.id,
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
      organizationId: req.session.organization.id,
    });
  }
}
