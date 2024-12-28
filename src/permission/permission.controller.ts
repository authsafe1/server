// permission.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
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
  async create(@Body() dto: CreatePermissionDto, @Req() req: Request) {
    return this.permissionService.createPermission({
      ...dto,
      Organization: { connect: { id: req.session.organization.id } },
    });
  }

  @Post("all")
  async findAll(@Body() dto: PermissionsDto) {
    return this.permissionService.getAllPermissions(dto);
  }

  @Get("count")
  async countPermissions(@Req() req: Request) {
    return this.permissionService.countPermissions({
      organizationId: req.session.organization.id,
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
