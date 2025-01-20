// permission.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Session,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import {
  CreatePermissionDto,
  PermissionsDto,
  UpdatePermissionDto,
} from "../common/dtos/permission.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { PermissionService } from "./permission.service";

@UseGuards(EnsureLoginGuard)
@Controller("permission")
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post("create")
  async create(
    @Body() dto: CreatePermissionDto,
    @Session() session: Request["session"],
  ) {
    return this.permissionService.createPermission({
      ...dto,
      Organization: { connect: { id: session?.organization?.id } },
    });
  }

  @Post("all")
  async findAll(@Body() dto: PermissionsDto) {
    return this.permissionService.getAllPermissions(dto);
  }

  @Get("count")
  async countPermissions(@Session() session: Request["session"]) {
    return this.permissionService.countPermissions({
      organizationId: session?.organization?.id,
    });
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.permissionService.getPermissionById(id);
  }

  @Put("update/:id")
  async update(
    @Param("id") id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return this.permissionService.updatePermission(id, updatePermissionDto);
  }

  @Delete("delete/:id")
  async remove(@Param("id") id: string) {
    return this.permissionService.deletePermission(id);
  }
}
