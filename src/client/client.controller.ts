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
  ClientsDto,
  CreateClientDto,
  UpdateClientDto,
} from "../common/dtos/client.dto";
import { ParamDto } from "../common/dtos/param.dto";
import { EnsureLoginGuard } from "../common/guards/ensure-login.guard";
import { ClientService } from "./client.service";

@UseGuards(EnsureLoginGuard)
@Controller("client")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post("all")
  async tokens(
    @Body()
    dto: ClientsDto,
    @Req() req: Request,
  ) {
    return this.clientService.clients(dto, req.session.organization.id);
  }

  @Get("count")
  async countClients(@Req() req: Request) {
    return await this.clientService.countClients({
      organizationId: req.session.organization.id,
    });
  }

  @Get(":id")
  async getClientById(@Param() params: ParamDto, @Req() req: Request) {
    return await this.clientService.client({
      id: params.id,
      organizationId: req.session.organization.id,
    });
  }

  @Post("create")
  async createClient(@Req() req: Request, @Body() dto: CreateClientDto) {
    return await this.clientService.createClient(
      req.session.organization.id,
      dto,
    );
  }

  @Put("update/:id")
  async updateClient(
    @Param() params: ParamDto,
    @Body() dto: UpdateClientDto,
    @Req() req: Request,
  ) {
    return await this.clientService.updateClient({
      data: dto,
      where: {
        id: params.id,
        organizationId: req.session.organization.id,
      },
    });
  }

  @Delete("delete/:id")
  async deleteClient(@Param() params: ParamDto, @Req() req: Request) {
    return await this.clientService.deleteClient({
      id: params.id,
      organizationId: req.session.organization.id,
    });
  }
}
