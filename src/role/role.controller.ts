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
  CreateRoleDto,
  RolesDto,
  UpdateRoleDto,
} from "../common/dtos/role.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { RoleService } from "./role.service";

@UseGuards(EnsureLoginGuard)
@Controller("role")
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post("create")
  async create(
    @Body() dto: CreateRoleDto,
    @Session() session: Request["session"],
  ) {
    const { permissions, ...dtoWithoutPermissions } = dto;
    return this.roleService.createRole({
      ...dtoWithoutPermissions,
      Permissions: {
        connect: permissions.map(value => {
          return { id: value.id };
        }),
      },
      Organization: { connect: { id: session?.organization?.id } },
    });
  }

  @Post("all")
  async findAll(@Body() dto: RolesDto) {
    return this.roleService.getAllRoles(dto);
  }

  @Get("count")
  async countUsers(@Session() session: Request["session"]) {
    return this.roleService.countRoles({
      organizationId: session?.organization?.id,
    });
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.roleService.getRoleById(id);
  }

  @Put("update/:id")
  async update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    const { permissions, ...dtoWithoutPermissions } = dto;
    return this.roleService.updateRole(id, {
      ...dtoWithoutPermissions,
      Permissions: {
        connect: permissions.map(value => {
          return { id: value.id };
        }),
      },
    });
  }

  @Delete("delete/:id")
  async remove(@Param("id") id: string) {
    return this.roleService.deleteRole(id);
  }
}
