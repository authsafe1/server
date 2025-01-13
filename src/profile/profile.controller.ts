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
import {
  ActivityLogDto,
  AuthorizationLogDto,
  SecurityAlertDto,
} from "src/common/dtos/log.dto";
import { AuthorizationLogService } from "src/common/modules/log/authorization-log.service";
import { SecurityAlertService } from "src/common/modules/log/security-log.service";
import { CacheInvalidate } from "../common/decorators/cache.decorator";
import { CreateProfileDto, UpdateProfileDto } from "../common/dtos/profile.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { ActivityLogService } from "../common/modules/log/activity-log.service";
import { ProfileService } from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly securityAlertService: SecurityAlertService,
    private readonly authorizationLogService: AuthorizationLogService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Post("create")
  async createUser(@Body() dto: CreateProfileDto) {
    return await this.profileService.createProfile(dto);
  }

  @Post("google/create")
  async createUserFromGoogle(
    @Body() dto: CreateProfileDto,
    @Req() req: Request,
  ) {
    const profile = await this.profileService.createProfileDirectly(dto);
    req.session.profile = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
    };
    return profile;
  }

  @Post("confirm")
  @CacheInvalidate("isAuthenticated")
  async verifyOrganization(@Query("token") token: string) {
    return await this.profileService.verifyProfileCreation(token);
  }

  @UseGuards(EnsureLoginGuard)
  @Put("update")
  @CacheInvalidate("isAuthenticated")
  async updateOrganization(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return await this.profileService.updateProfile({
      where: { id: req.session.profile.id },
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
    return await this.profileService.updateProfilePhoto({
      where: { id: req.session.profile.id },
      file,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Delete("delete")
  @CacheInvalidate("isAuthenticated")
  async deleteOrganization(@Req() req: Request, @Res() res: Response) {
    this.profileService.deleteProfile({
      id: req.session.profile.id,
    });
    if (req.session) {
      req.session.destroy(err => {
        if (err) {
          return res.status(500).json({ message: "Internal Server Error" });
        }
        res.clearCookie("__session");
        return { message: "Profile Deleted" };
      });
    } else {
      return { message: "Profile Deleted" };
    }
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/activity/data")
  async getActivityData(@Req() req: Request) {
    return await this.activityLogService.getUserActivityOverTime(
      req.session?.profile?.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/security/all")
  async getAllSecurityLogs(@Req() req: Request, @Body() dto: SecurityAlertDto) {
    const { where, ...params } = dto;
    return await this.securityAlertService.getAllSecurityAlerts({
      where: {
        ...where,
        profileId: req.session?.profile?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/security/count")
  async countSecurityLogs(@Req() req: Request) {
    return await this.securityAlertService.countSecurityAlerts({
      profileId: req.session?.profile?.id,
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
        profileId: req.session?.profile?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/authorization/count")
  async countAuthorizationLogs(@Req() req: Request) {
    return await this.authorizationLogService.countAuthorizationLogs({
      profileId: req.session?.profile?.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/activity/all")
  async getAllActivityLogs(@Req() req: Request, @Body() dto: ActivityLogDto) {
    const { where, ...params } = dto;
    return await this.activityLogService.getAllActivityLogs({
      where: {
        ...where,
        profileId: req.session?.profile?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/activity/count")
  async countActivityLogs(@Req() req: Request) {
    return await this.activityLogService.countActivityLogs({
      profileId: req.session?.profile?.id,
    });
  }
}
