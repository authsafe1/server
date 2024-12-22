import { Module } from "@nestjs/common";
import { AxiosModule } from "../axios/axios.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ClientEventListener } from "./client.listener";
import { OrganizationEventListener } from "./organization.listener";
import { PermissionEventListener } from "./permission.listener";
import { RoleEventListener } from "./role.listener";
import { UserEventListener } from "./user.listener";

@Module({
  imports: [PrismaModule, AxiosModule],
  providers: [
    OrganizationEventListener,
    UserEventListener,
    ClientEventListener,
    PermissionEventListener,
    RoleEventListener,
  ],
})
export class ListenerModule {}
