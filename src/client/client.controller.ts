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
    @Session() session: Request["session"],
  ) {
    return this.clientService.clients(dto, session?.organization?.id);
  }

  @Get("count")
  async countClients(@Session() session: Request["session"]) {
    return await this.clientService.countClients({
      organizationId: session?.organization?.id,
    });
  }

  @Get(":id")
  async getClientById(
    @Param() params: ParamDto,
    @Session() session: Request["session"],
  ) {
    return await this.clientService.client({
      id: params.id,
      organizationId: session?.organization?.id,
    });
  }

  @Post("create")
  async createClient(
    @Body() dto: CreateClientDto,
    @Session() session: Request["session"],
  ) {
    return await this.clientService.createClient(
      dto,
      session?.organization?.id,
    );
  }

  @Put("update/:id")
  async updateClient(
    @Param() params: ParamDto,
    @Body() dto: UpdateClientDto,
    @Session() session: Request["session"],
  ) {
    return await this.clientService.updateClient({
      data: dto,
      where: {
        id: params.id,
        organizationId: session?.organization?.id,
      },
    });
  }

  @Delete("delete/:id")
  async deleteClient(
    @Param() params: ParamDto,
    @Session() session: Request["session"],
  ) {
    return await this.clientService.deleteClient({
      id: params.id,
      organizationId: session?.organization?.id,
    });
  }
}
