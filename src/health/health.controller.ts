import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from "@nestjs/terminus";
import { PrismaService } from "../common/modules/prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  healthCheck() {
    return this.health.check([
      () => this.http.pingCheck("app", process.env.APP_URL),
      () => this.prisma.pingCheck("database", this.prismaService),
      () => this.memory.checkHeap("heap", 1024 * 1024 * 1024),
      () => this.memory.checkRSS("rss", 200 * 1024 * 1024),
    ]);
  }
}
