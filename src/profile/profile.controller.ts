import { CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Delete,
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
import { CreateProfileDto, UpdateProfileDto } from "../common/dtos/profile.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { ProfileService } from "./profile.service";

@Controller("profile")
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
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
}
