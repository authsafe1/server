import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  AssignRoleDto,
  CreateUserDto,
  InviteUserDto,
  UpdateUserDto,
  UsersDto,
  VerifyUserDto,
} from "../common/dtos/user.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(EnsureLoginGuard)
  @Post("all")
  async users(
    @Body()
    dto: UsersDto,
    @Req() req: Request,
  ) {
    return this.userService.users(dto, req.session.organization.id);
  }

  @UseGuards(EnsureLoginGuard)
  @Get("count")
  async countUsers(@Req() req: Request) {
    return this.userService.countUsers({
      organizationId: req.session.organization.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("count/month")
  async countUsersMonthwise(@Req() req: Request) {
    return await this.userService.getMonthlyUserCount(
      req.session.organization.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Get(":id")
  async getUser(@Param("id") id: string, @Req() req: Request) {
    return this.userService.user({
      id,
      organizationId: req.session.organization.id,
      isVerified: true,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("create")
  async createUser(@Body() dto: CreateUserDto, @Req() req: Request) {
    return await this.userService.createUser(req.session.organization.id, dto);
  }

  @UseGuards(EnsureLoginGuard)
  @Post("invite")
  async inviteUser(@Body() dto: InviteUserDto, @Req() req: Request) {
    return await this.userService.inviteUser(req.session.organization.id, dto);
  }

  @Post("confirm")
  async confirmUser(@Query("token") token: string, @Body() dto: VerifyUserDto) {
    return await this.userService.verifyUser(token, dto);
  }

  @UseGuards(EnsureLoginGuard)
  @Put("update/:id")
  async updateUser(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
    @Param("id") id: string,
  ) {
    return await this.userService.updateUser({
      data: dto,
      where: {
        id,
        organizationId: req.session.organization.id,
      },
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("assign/role/:id")
  async assignRole(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return await this.userService.assignRole(
      id,
      req.session.organization.id,
      dto,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Delete("delete/:id")
  async deleteUser(@Req() req: Request, @Param("id") id: string) {
    return await this.userService.deleteUser({
      id,
      organizationId: req.session.organization.id,
    });
  }
}
