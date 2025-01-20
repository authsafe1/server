import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Session,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  AssignRoleDto,
  CreateBulkUsersDto,
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
    @Session() session: Request["session"],
  ) {
    return this.userService.users(dto, session?.organization?.id);
  }

  @UseGuards(EnsureLoginGuard)
  @Get("count")
  async countUsers(@Session() session: Request["session"]) {
    return this.userService.countUsers({
      organizationId: session?.organization?.id,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Get("count/month")
  async countUsersMonthwise(@Session() session: Request["session"]) {
    return await this.userService.getMonthlyUserCount(
      session?.organization?.id,
    );
  }

  @UseGuards(EnsureLoginGuard)
  @Get(":id")
  async getUser(
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return this.userService.user({
      id,
      organizationId: session?.organization?.id,
      isVerified: true,
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("create")
  async createUser(
    @Body() dto: CreateUserDto,
    @Session() session: Request["session"],
  ) {
    return this.userService.createUser(dto, session?.organization?.id);
  }

  @UseGuards(EnsureLoginGuard)
  @Post("create/bulk")
  async createUsers(
    @Body() dto: CreateBulkUsersDto,
    @Session() session: Request["session"],
  ) {
    return this.userService.createUsers(dto.data, session?.organization?.id);
  }

  @UseGuards(EnsureLoginGuard)
  @Post("invite")
  async inviteUser(
    @Body() dto: InviteUserDto,
    @Session() session: Request["session"],
  ) {
    return this.userService.inviteUser(dto, session?.organization?.id);
  }

  @Post("confirm")
  async confirmUser(@Query("token") token: string, @Body() dto: VerifyUserDto) {
    return this.userService.verifyUser(token, dto);
  }

  @UseGuards(EnsureLoginGuard)
  @Put("update/:id")
  async updateUser(
    @Body() dto: UpdateUserDto,
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return this.userService.updateUser({
      data: dto,
      where: {
        id,
        organizationId: session?.organization?.id,
      },
    });
  }

  @UseGuards(EnsureLoginGuard)
  @Post("assign/role/:id")
  async assignRole(
    @Param("id") id: string,
    @Body() dto: AssignRoleDto,
    @Session() session: Request["session"],
  ) {
    return this.userService.assignRole(id, session?.organization?.id, dto);
  }

  @UseGuards(EnsureLoginGuard)
  @Delete("delete/:id")
  async deleteUser(
    @Param("id") id: string,
    @Session() session: Request["session"],
  ) {
    return this.userService.deleteUser({
      id,
      organizationId: session?.organization?.id,
    });
  }
}
