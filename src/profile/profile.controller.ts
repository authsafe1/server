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
  Session,
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
import {
  ChangePasswordDto,
  CreateProfileDto,
  UpdateProfileDto,
} from "../common/dtos/profile.dto";
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
  async updateOrganization(
    @Body() dto: UpdateProfileDto,
    @Session() session: Request["session"],
  ) {
    return await this.profileService.updateProfile({
      where: { id: session?.profile?.id },
      data: dto,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Put("change-password")
  @CacheInvalidate("isAuthenticated")
  async resetPassword(
    @Body() dto: ChangePasswordDto,
    @Session() session: Request["session"],
  ) {
    return await this.profileService.changePassword(
      session?.profile?.email,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Post("upload/photo")
  @UseInterceptors(FileInterceptor("file"))
  @CacheInvalidate("isAuthenticated")
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Session() session: Request["session"],
  ) {
    return await this.profileService.updateProfilePhoto({
      where: { id: session?.profile?.id },
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
  async getActivityData(@Session() session: Request["session"]) {
    return await this.activityLogService.getUserActivityOverTime(
      session?.profile?.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/security/all")
  async getAllSecurityLogs(
    @Body() dto: SecurityAlertDto,
    @Session() session: Request["session"],
  ) {
    const { where, ...params } = dto;
    return await this.securityAlertService.getAllSecurityAlerts({
      where: {
        ...where,
        profileId: session?.profile?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/security/count")
  async countSecurityLogs(@Session() session: Request["session"]) {
    return await this.securityAlertService.countSecurityAlerts({
      profileId: session?.profile?.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/authorization/all")
  async getAllAuthorizationLogs(
    @Body() dto: AuthorizationLogDto,
    @Session() session: Request["session"],
  ) {
    const { where, ...params } = dto;
    return await this.authorizationLogService.getAllAuthorizationLogs({
      where: {
        ...where,
        profileId: session?.profile?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/authorization/count")
  async countAuthorizationLogs(@Session() session: Request["session"]) {
    return await this.authorizationLogService.countAuthorizationLogs({
      profileId: session?.profile?.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("log/activity/all")
  async getAllActivityLogs(
    @Body() dto: ActivityLogDto,
    @Session() session: Request["session"],
  ) {
    const { where, ...params } = dto;
    return await this.activityLogService.getAllActivityLogs({
      where: {
        ...where,
        profileId: session?.profile?.id,
      },
      ...params,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("log/activity/count")
  async countActivityLogs(@Session() session: Request["session"]) {
    return await this.activityLogService.countActivityLogs({
      profileId: session?.profile?.id,
    });
  }
}
